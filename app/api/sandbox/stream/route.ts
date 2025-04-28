import { FragmentSchema } from '@/lib/schema'
import { ExecutionResultInterpreter, ExecutionResultWeb } from '@/lib/types'
import { Sandbox } from '@/lib/sandbox'

const sandboxTimeout = 10 * 60 * 1000 // 10 minute in ms

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    fragment,
    userID,
    teamID,
    accessToken,
  }: {
    fragment: FragmentSchema
    userID: string | undefined
    teamID: string | undefined
    accessToken: string | undefined
  } = await req.json()
  console.log('fragment', fragment)
  console.log('userID', userID)

  // Create a sandbox
  const sbx = await Sandbox.create(fragment.template, {
    metadata: {
      template: fragment.template,
      userID: userID ?? '',
      teamID: teamID ?? '',
    },
    timeoutMs: sandboxTimeout,
  })

  // Create a stream
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Helper function to write to stream
  const writeToStream = async (data: any) => {
    await writer.write(encoder.encode(JSON.stringify(data) + '\n'))
  }

  // Start processing in background
  ;(async () => {
    try {
      // Install packages
      if (fragment.has_additional_dependencies) {
        await writeToStream({
          type: 'status',
          message: `Installing dependencies: ${fragment.additional_dependencies.join(', ')}`,
        })
        await sbx.runCommand(fragment.install_dependencies_command)
      }

      // Copy code to fs
      if (fragment.code && Array.isArray(fragment.code)) {
        for (const file of fragment.code) {
          await sbx.writeFile(file.file_path, file.file_content)
          await writeToStream({
            type: 'status',
            message: `Copied file to ${file.file_path}`,
          })
        }
      } else {
        await sbx.writeFile(fragment.file_path, fragment.code)
        await writeToStream({
          type: 'status',
          message: `Copied file to ${fragment.file_path}`,
        })
      }

      // Execute code or return a URL to the running sandbox
      if (fragment.template === 'code-interpreter-v1') {
        const { logs, error, results } = await sbx.runCode(fragment.code || '', async (type, data) => {
          await writeToStream({
            type: 'output',
            outputType: type,
            data,
          })
        })

        await writeToStream({
          type: 'result',
          data: {
            id: sbx.id,
            template: fragment.template,
            stdout: logs.stdout,
            stderr: logs.stderr,
            runtimeError: error,
            cellResults: results,
          } as ExecutionResultInterpreter,
        })
      } else {
        await writeToStream({
          type: 'result',
          data: {
            id: sbx.id,
            template: fragment.template,
            url: `http://${sbx.getHost(fragment.port || 80)}`,
          } as ExecutionResultWeb,
        })
      }
    } catch (error) {
      await writeToStream({
        type: 'error',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}