import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { CellResult, ExecutionError } from './types'

const SANDBOX_ROOT = '/tmp/fragments'

export class Sandbox {
  id: string
  template: string
  port?: number
  private workdir: string

  private constructor(template: string) {
    this.id = randomUUID()
    this.template = template
    this.workdir = join(SANDBOX_ROOT, this.id)
  }

  static async create(template: string, options?: {
    metadata?: Record<string, string>
    timeoutMs?: number
  }): Promise<Sandbox> {
    const sandbox = new Sandbox(template)
    await mkdir(sandbox.workdir, { recursive: true })
    return sandbox
  }

  async runCommand(command: string, onOutput?: (type: 'stdout' | 'stderr', data: string) => void): Promise<{stdout: string[], stderr: string[]}> {
    return new Promise((resolve, reject) => {
      const proc = spawn('bash', ['-c', command], {
        cwd: this.workdir,
      })

      const stdout: string[] = []
      const stderr: string[] = []

      proc.stdout.on('data', (data) => {
        const str = data.toString()
        stdout.push(str)
        onOutput?.('stdout', str)
      })

      proc.stderr.on('data', (data) => {
        const str = data.toString()
        stderr.push(str)
        onOutput?.('stderr', str)
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr })
        } else {
          reject(new Error(`Command failed with code ${code}`))
        }
      })
    })
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fullPath = join(this.workdir, path)
    await writeFile(fullPath, content)
  }

  async runCode(code: string, onOutput?: (type: 'stdout' | 'stderr', data: string) => void): Promise<{
    logs: { stdout: string[], stderr: string[] }
    error?: ExecutionError
    results: CellResult[]
  }> {
    // Write code to a file
    await this.writeFile('code.py', code)

    try {
      const { stdout, stderr } = await this.runCommand('python3 code.py', onOutput)
      return {
        logs: { stdout, stderr },
        results: stdout.map(output => ({
          type: 'text',
          content: output,
        }))
      }
    } catch (error) {
      const err = error as Error
      return {
        logs: { stdout: [], stderr: [] },
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        results: []
      }
    }
  }

  getHost(port: number): string {
    this.port = port
    return `localhost:${port}`
  }

  async cleanup(): Promise<void> {
    await this.runCommand(`rm -rf ${this.workdir}`)
  }
}