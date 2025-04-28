export const LITELLM_API_KEY = process.env.LITELLM_API_KEY || 'sk-oeD642K51JJvgL2QA9hu-w'
export const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || 'https://nebularelayoceantree-5e17c78de697.herokuapp.com'

export const DEFAULT_CHAT_MODEL = process.env.DEFAULT_LLM_MODEL || 'claude-3-5-haiku'
export const DEFAULT_LLM_MODEL = DEFAULT_CHAT_MODEL

export const AVAILABLE_MODELS = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    providerId: 'anthropic'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    providerId: 'anthropic'
  },
  {
    id: 'openai-gpt-3.5',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    providerId: 'openai'
  },
  {
    id: 'openai-gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    providerId: 'openai'
  },
  {
    id: 'R1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    providerId: 'deepseek'
  },
  {
    id: 'mistral-24b',
    name: 'Mistral 24B',
    provider: 'Mistral',
    providerId: 'mistral'
  },
  {
    id: 'qwen-72b-instruct',
    name: 'Qwen 72B',
    provider: 'Qwen',
    providerId: 'qwen'
  },
  {
    id: 'o3-mini-high',
    name: 'O3 Mini High',
    provider: 'Ocean',
    providerId: 'ocean'
  },
  {
    id: 'flash-2',
    name: 'Flash-2',
    provider: 'Flash',
    providerId: 'flash'
  },
  {
    id: 'sonar',
    name: 'Sonar',
    provider: 'Sonar',
    providerId: 'sonar'
  },
  {
    id: 'Ministral-8b',
    name: 'Ministral 8B',
    provider: 'Mistral',
    providerId: 'mistral'
  }
]