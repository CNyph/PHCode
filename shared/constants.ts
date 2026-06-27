export const DEFAULT_MODEL = 'qwen2.5:0.5b'

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  CONVERSATIONS: '/api/conversations',
  MESSAGES: '/api/messages',
  CHAT_STREAM: '/api/chat/stream',
  CHAT_MODELS: '/api/chat/models',
  WEB_SEARCH: '/api/search/web',
  SETTINGS: '/api/settings',
  UPLOAD: '/api/upload',
  KNOWLEDGE: '/api/knowledge',
  PROMPTS: '/api/prompts',
  HEALTH: '/api/health'
} as const

export const STORAGE_KEYS = {
  SETTINGS: 'phcode-settings',
  THEME: 'phcode-theme',
  AUTH: 'phcode-auth'
} as const

export const TIMEOUTS = {
  AI_SERVICE: 30000,
  MODEL_LIST: 10000,
  MODEL_FETCH: 15000,
  OLLAMA_CHECK: 5000,
  TOAST_DURATION: 5000,
  COPY_FEEDBACK: 2000,
  DB_SAVE_DELAY: 1000
} as const

export const LIMITS = {
  MAX_MESSAGE_LENGTH: 100000,
  MAX_FILE_SIZE_MB: 50,
  MAX_FILES_PER_UPLOAD: 10,
  MAX_TITLE_LENGTH: 30,
  MAX_HISTORY_MESSAGES: 50
} as const
