import { Duration } from '@/lib/duration'
import { getModelClient } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage } from 'ai'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    teamID,
    template,
    model,
    config,
  }: {
    messages: CoreMessage[]
    userID: string | undefined
    teamID: string | undefined
    template: Templates
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        req.headers.get('x-forwarded-for'),
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  console.log('userID', userID)
  console.log('teamID', teamID)
  // console.log('template', template)
  console.log('model', model)
  // console.log('config', config)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  try {
    console.log('Sending request to LiteLLM:', {
      model: model.id,
      messages,
      config: modelParams,
    })

    const response = await fetch(`${process.env.LITELLM_BASE_URL || 'https://nebularelayoceantree-5e17c78de697.herokuapp.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY || 'sk-oeD642K51JJvgL2QA9hu-w'}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages,
        stream: true,
        ...modelParams,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get completion')
    }

    console.log('Got response from LiteLLM')

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit. Try using your own API key.',
        {
          status: 429,
        },
      )
    }

    if (isOverloadedError) {
      return new Response(
        'The provider is currently unavailable. Please try again later.',
        {
          status: 529,
        },
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        'Access denied. Please make sure your API key is valid.',
        {
          status: 403,
        },
      )
    }

    console.error('Error:', error)

    return new Response(
      'An unexpected error has occurred. Please try again later.',
      {
        status: 500,
      },
    )
  }
}
