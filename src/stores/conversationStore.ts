import { create } from 'zustand'
import type { Conversation, Message } from '../types/api'
import { conversationApi, messageApi } from '../services/api'
import { useChatStore } from './chatStore'

interface ConversationState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  branches: Array<{ branch_id: string; count: number }>
  currentBranch: string
  isLoading: boolean
  error: string | null

  fetchConversations: () => Promise<void>
  createConversation: (title?: string, modelId?: string) => Promise<Conversation>
  selectConversation: (id: string) => Promise<void>
  updateConversation: (id: string, data: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  addMessage: (
    conversationId: string,
    message: Omit<Message, 'id' | 'created_at' | 'parent_message_id' | 'branch_id'>,
  ) => Promise<Message>
  getMessages: (conversationId: string) => Promise<Message[]>
  clearMessages: () => void
  switchBranch: (branchId: string) => Promise<void>
  createBranch: (fromMessageId: string) => string
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  branches: [{ branch_id: 'main', count: 0 }],
  currentBranch: 'main',
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const conversations = await conversationApi.getAll()
      set({ conversations, isLoading: false })
    } catch {
      set({ error: 'Failed to fetch conversations', isLoading: false })
    }
  },

  createConversation: async (title, modelId) => {
    const conversation = await conversationApi.create({
      title: title || '',
      model_id: modelId,
    })
    useChatStore.setState({ webSearchSources: [] })
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversation: conversation,
      messages: [],
      branches: [{ branch_id: 'main', count: 0 }],
      currentBranch: 'main',
    }))
    return conversation
  },

  selectConversation: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const [conversation, messages, branches] = await Promise.all([
        conversationApi.getById(id),
        messageApi.getByConversationId(id),
        messageApi.getBranches(id),
      ])
      const lastBranch = branches.length > 0 ? branches[branches.length - 1].branch_id : 'main'
      set({
        currentConversation: conversation,
        messages,
        branches: branches.length > 0 ? branches : [{ branch_id: 'main', count: 0 }],
        currentBranch: lastBranch,
        isLoading: false,
      })
      useChatStore.setState({ webSearchSources: [] })
    } catch {
      set({ error: 'Failed to load conversation', isLoading: false })
    }
  },

  updateConversation: async (id, data) => {
    const updated = await conversationApi.update(id, {
      title: data.title ?? undefined,
      model_id: data.model_id ?? undefined,
      system_prompt: data.system_prompt ?? undefined,
    })
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
      currentConversation:
        state.currentConversation?.id === id ? updated : state.currentConversation,
    }))
  },

  deleteConversation: async (id) => {
    await conversationApi.delete(id)
    set((state) => {
      const conversations = state.conversations.filter((c) => c.id !== id)
      const shouldSelectNew = state.currentConversation?.id === id
      return {
        conversations,
        currentConversation: shouldSelectNew ? conversations[0] || null : state.currentConversation,
        messages: shouldSelectNew ? [] : state.messages,
      }
    })
    const newState = useConversationStore.getState()
    if (newState.currentConversation && newState.messages.length === 0) {
      await useConversationStore.getState().selectConversation(newState.currentConversation.id)
    }
    useChatStore.setState({ webSearchSources: [] })
  },

  addMessage: async (conversationId, messageData) => {
    const { currentBranch } = get()
    const message = await messageApi.create(conversationId, {
      role: messageData.role,
      content: messageData.content,
      model_id: messageData.model_id ?? undefined,
      tokens_used: messageData.tokens_used ?? undefined,
      branch_id: currentBranch,
    })
    set((state) => ({
      messages: [...state.messages, message],
    }))
    return message
  },

  getMessages: async (conversationId) => {
    try {
      return await messageApi.getByConversationId(conversationId)
    } catch {
      return []
    }
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  switchBranch: async (branchId) => {
    const { currentConversation } = get()
    if (!currentConversation) return

    set({ isLoading: true, currentBranch: branchId })
    try {
      const messages = await messageApi.getBranchMessages(currentConversation.id, branchId)
      set({ messages, isLoading: false })
      useChatStore.setState({ webSearchSources: [] })
    } catch {
      set({ error: 'Failed to load branch', isLoading: false })
    }
  },

  createBranch: (fromMessageId) => {
    const branchId = `branch-${Date.now()}`
    set((state) => ({
      branches: [...state.branches, { branch_id: branchId, count: 0 }],
      currentBranch: branchId,
      messages: state.messages.filter(
        (m) =>
          m.id === fromMessageId || (m.parent_message_id && m.parent_message_id !== fromMessageId),
      ),
    }))
    return branchId
  },
}))
