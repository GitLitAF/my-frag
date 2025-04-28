import { LITELLM_API_KEY, LITELLM_BASE_URL } from './config'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export async function getModelCompletion(
  messages: { role: string; content: string }[],
  model: LLMModel,
  config: LLMModelConfig,
  signal?: AbortSignal
) {
  const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      stream: true,
      ...config,
    }),
    signal,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to get completion')
  }

  return response.body!
}

export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  return {
    chat: {
      completions: {
        stream: (options: {
          messages: { role: string; content: string }[]
          signal?: AbortSignal
        }) => getModelCompletion(options.messages, model, config, options.signal),
      },
    },
  }
}
