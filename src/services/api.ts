import type {
  AuthResponse,
  AuthUser,
  Conversation,
  Message,
  CreateConversationRequest,
  CreateMessageRequest,
  ModelListResponse,
  PromptTemplate,
  KnowledgeBase,
  KnowledgeDocument,
} from '../types/api'
import { API_ENDPOINTS } from '../types/api'

const API_BASE = 'http://localhost:3000'
const SETTINGS_STORAGE_KEY = 'phcode-settings'
const AUTH_STORAGE_KEY = 'phcode-auth'

function url(path: string): string {
  return `${API_BASE}${path}`
}

function getOllamaBaseUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!saved) return undefined

    const data = JSON.parse(saved) as { ollamaUrl?: string }
    const value = data.ollamaUrl?.trim()
    return value || undefined
  } catch {
    return undefined
  }
}

function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!saved) return undefined

    const data = JSON.parse(saved) as { token?: string }
    const value = data.token?.trim()
    return value || undefined
  } catch {
    return undefined
  }
}

function getOllamaBaseUrlQuery(): string {
  const ollamaBaseUrl = getOllamaBaseUrl()
  return ollamaBaseUrl ? `ollama_base_url=${encodeURIComponent(ollamaBaseUrl)}` : ''
}

async function fetchJson<T>(url: string, options?: RequestInit & { timeout?: number }): Promise<T> {
  const controller = new AbortController()
  const timeoutId = options?.timeout
    ? setTimeout(() => controller.abort(), options.timeout)
    : undefined

  try {
    const hasBody =
      options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())
    const token = getAuthToken()
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
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

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

export const conversationApi = {
  getAll: () => fetchJson<Conversation[]>(url(API_ENDPOINTS.CONVERSATIONS)),

  getById: (id: string) => fetchJson<Conversation>(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`)),

  create: (data: CreateConversationRequest) =>
    fetchJson<Conversation>(url(API_ENDPOINTS.CONVERSATIONS), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateConversationRequest>) =>
    fetchJson<Conversation>(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    authFetch(url(`${API_ENDPOINTS.CONVERSATIONS}/${id}`), { method: 'DELETE' }),
}

export const messageApi = {
  getByConversationId: (conversationId: string) =>
    fetchJson<Message[]>(url(`${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`)),

  getBranches: (conversationId: string) =>
    fetchJson<Array<{ branch_id: string; count: number }>>(
      url(`${API_ENDPOINTS.MESSAGES}/branches/${conversationId}`),
    ),

  getBranchMessages: (conversationId: string, branchId: string) =>
    fetchJson<Message[]>(url(`${API_ENDPOINTS.MESSAGES}/branch/${conversationId}/${branchId}`)),

  create: (conversationId: string, data: CreateMessageRequest) =>
    fetchJson<Message>(url(API_ENDPOINTS.MESSAGES), {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, ...data }),
    }),

  update: (id: string, content: string) =>
    fetchJson<Message>(url(`${API_ENDPOINTS.MESSAGES}/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  delete: (id: string) => authFetch(url(`${API_ENDPOINTS.MESSAGES}/${id}`), { method: 'DELETE' }),
}

export const promptApi = {
  getAll: (category?: string) =>
    fetchJson<PromptTemplate[]>(
      url(category ? `${API_ENDPOINTS.PROMPTS}?category=${category}` : API_ENDPOINTS.PROMPTS),
    ),

  getById: (id: string) => fetchJson<PromptTemplate>(url(`${API_ENDPOINTS.PROMPTS}/${id}`)),

  create: (data: { name: string; content: string; category: string }) =>
    fetchJson<PromptTemplate>(url(API_ENDPOINTS.PROMPTS), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; content: string; category: string }>) =>
    fetchJson<PromptTemplate>(url(`${API_ENDPOINTS.PROMPTS}/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => authFetch(url(`${API_ENDPOINTS.PROMPTS}/${id}`), { method: 'DELETE' }),
}

export const chatApi = {
  getModels: (options?: { timeout?: number }) =>
    fetchJson<ModelListResponse>(
      url(
        getOllamaBaseUrlQuery()
          ? `${API_ENDPOINTS.CHAT_MODELS}?${getOllamaBaseUrlQuery()}`
          : API_ENDPOINTS.CHAT_MODELS,
      ),
      { timeout: options?.timeout },
    ),

  stream: async function* (
    conversationId: string,
    content: string,
    modelId?: string,
    signal?: AbortSignal,
    knowledgeBaseId?: string,
    webSearchEnabled?: boolean,
  ) {
    const response = await authFetch(url(API_ENDPOINTS.CHAT_STREAM), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        model_id: modelId,
        knowledge_base_id: knowledgeBaseId,
        web_search: Boolean(webSearchEnabled),
        ollama_base_url: getOllamaBaseUrl() || undefined,
      }),
      signal,
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
  },
}

export const webSearchApi = {
  search: (query: string, topK = 5) =>
    fetchJson<{ results: Array<{ title: string; url: string; snippet: string }> }>(
      url(API_ENDPOINTS.WEB_SEARCH),
      {
        method: 'POST',
        body: JSON.stringify({ query, top_k: topK }),
      },
    ),
}

export const authApi = {
  register: (data: { username: string; password: string; display_name?: string }) =>
    fetchJson<AuthResponse>(url(`${API_ENDPOINTS.AUTH}/register`), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { username: string; password: string }) =>
    fetchJson<AuthResponse>(url(`${API_ENDPOINTS.AUTH}/login`), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchJson<AuthUser>(url(`${API_ENDPOINTS.AUTH}/me`)),

  logout: () =>
    fetchJson<{ ok: true }>(url(`${API_ENDPOINTS.AUTH}/logout`), {
      method: 'POST',
    }),
}

export const knowledgeApi = {
  getAll: () => fetchJson<KnowledgeBase[]>(url(API_ENDPOINTS.KNOWLEDGE)),

  getById: (id: string) => fetchJson<KnowledgeBase>(url(`${API_ENDPOINTS.KNOWLEDGE}/${id}`)),

  create: (data: { name: string; description?: string }) =>
    fetchJson<KnowledgeBase>(url(API_ENDPOINTS.KNOWLEDGE), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    fetchJson<KnowledgeBase>(url(`${API_ENDPOINTS.KNOWLEDGE}/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => authFetch(url(`${API_ENDPOINTS.KNOWLEDGE}/${id}`), { method: 'DELETE' }),

  getDocuments: (kbId: string) =>
    fetchJson<KnowledgeDocument[]>(url(`${API_ENDPOINTS.KNOWLEDGE}/${kbId}/documents`)),

  addDocument: (
    kbId: string,
    data: { filename: string; file_path: string; file_type?: string; content?: string },
  ) =>
    fetchJson<KnowledgeDocument>(url(`${API_ENDPOINTS.KNOWLEDGE}/${kbId}/documents`), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteDocument: (kbId: string, docId: string) =>
    authFetch(url(`${API_ENDPOINTS.KNOWLEDGE}/${kbId}/documents/${docId}`), { method: 'DELETE' }),

  search: (kbId: string, query: string) =>
    fetchJson<{
      results: Array<{ content: string; score: number; document_id: string }>
      context: string
    }>(url(`${API_ENDPOINTS.KNOWLEDGE}/${kbId}/search`), {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
}
