import { create } from 'zustand'
import { authApi } from '../services/api'
import type { AuthResponse, AuthUser } from '../types/api'
import { DEFAULT_MODEL } from '../types/api'
import { loadAuthSession, saveAuthSession } from '../services/session'
import { useConversationStore } from './conversationStore'
import { useChatStore } from './chatStore'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  initialize: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  setSession: (session: AuthResponse | null) => void
}

function applySession(session: AuthResponse | null): void {
  saveAuthSession(session)
  const selectedModel = useChatStore.getState().selectedModel
  if (session) {
    useChatStore.getState().reloadSelectedModel()
    useConversationStore.getState().fetchConversations()
    if (!selectedModel) {
      useChatStore.getState().reloadSelectedModel()
    }
  } else {
    useConversationStore.setState({
      conversations: [],
      currentConversation: null,
      messages: [],
      branches: [{ branch_id: 'main', count: 0 }],
      currentBranch: 'main',
      isLoading: false,
      error: null,
    })
    useChatStore.setState({
      selectedModel: DEFAULT_MODEL,
      selectedKnowledgeBase: null,
      webSearchEnabled: false,
      isStreaming: false,
      streamingContent: '',
      abortController: null,
      lastUserMessage: null,
    })
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setSession: (session) => {
    set({
      user: session?.user || null,
      token: session?.token || null,
    })
    applySession(session)
  },

  initialize: async () => {
    set({ isLoading: true })
    const session = loadAuthSession()
    if (!session) {
      set({ user: null, token: null, isLoading: false })
      applySession(null)
      return
    }

    set({ user: session.user, token: session.token })
    try {
      const user = await authApi.me()
      const freshSession: AuthResponse = { token: session.token, user }
      saveAuthSession(freshSession)
      set({ user, token: session.token, isLoading: false })
      applySession(freshSession)
    } catch {
      saveAuthSession(null)
      set({ user: null, token: null, isLoading: false })
      applySession(null)
    }
  },

  login: async (username, password) => {
    const session = await authApi.login({ username, password })
    set({ user: session.user, token: session.token, isLoading: false })
    applySession(session)
  },

  register: async (username, password, displayName) => {
    const session = await authApi.register({ username, password, display_name: displayName })
    set({ user: session.user, token: session.token, isLoading: false })
    applySession(session)
  },

  logout: async () => {
    const { token } = get()
    try {
      if (token) {
        await authApi.logout()
      }
    } finally {
      saveAuthSession(null)
      set({ user: null, token: null, isLoading: false })
      applySession(null)
    }
  },
}))
