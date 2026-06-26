import type {
  Conversation,
  Message,
  CreateConversationRequest,
  CreateMessageRequest,
  ModelListResponse
} from '../types/api'
import { API_ENDPOINTS } from '../types/api'

const API_BASE = 'http://localhost:3000'

function url(path: string): string {
  return `${API_BASE}${path}`
}

async function fetchJson<T>(url: string, options?: RequestInit & { timeout?: number }): Promise<T> {
  const controller = new AbortController()
  const timeoutId = options?.timeout
    ? setTimeout(() => controller.abort(), options.timeout)
    : undefined

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error || `API error: ${response.status}`)
    }

    return response.json()
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export const conversationApi = {
  getAll: () => fetchJson<Conversation[]>(url(API_ENDPOINTS.CONVERSATIONS)),

  getById: (id: string) => fetchJson<Conversation>(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`)),

  create: (data: CreateConversationRequest) =>
    fetchJson<Conversation>(url(API_ENDPOINTS.CONVERSATIONS), {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id: string, data: Partial<CreateConversationRequest>) =>
    fetchJson<Conversation>(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    fetch(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`), { method: 'DELETE' })
}

export const messageApi = {
  getByConversationId: (conversationId: string) =>
    fetchJson<Message[]>(url(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`)),

  create: (conversationId: string, data: CreateMessageRequest) =>
    fetchJson<Message>(url(API_ENDPOINTS.MESSAGES), {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, ...data })
    }),

  update: (id: string, content: string) =>
    fetchJson<Message>(url(`${API_ENDPOINTS.MESSAGES}/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ content })
    }),

  delete: (id: string) =>
    fetch(url(`${API_ENDPOINTS.MESSAGES}/${id}`), { method: 'DELETE' })
}

export const chatApi = {
  getModels: (options?: { timeout?: number }) =>
    fetchJson<ModelListResponse>(url(API_ENDPOINTS.CHAT_MODELS), { timeout: options?.timeout }),

  stream: async function* (conversationId: string, content: string, modelId?: string, signal?: AbortSignal) {
    const response = await fetch(url(API_ENDPOINTS.CHAT_STREAM), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        model_id: modelId
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Chat error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try {
            yield JSON.parse(data)
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }
}
