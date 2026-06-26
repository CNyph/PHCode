import { create } from 'zustand'
import type { Conversation, Message } from '../types/api'
import { conversationApi, messageApi } from '../services/api'

interface ConversationState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  error: string | null

  fetchConversations: () => Promise<void>
  createConversation: (title?: string, modelId?: string) => Promise<Conversation>
  selectConversation: (id: string) => Promise<void>
  updateConversation: (id: string, data: Partial<Conversation>) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'created_at'>) => Promise<Message>
  getMessages: (conversationId: string) => Promise<Message[]>
  clearMessages: () => void
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
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
      model_id: modelId
    })
    set(state => ({
      conversations: [conversation, ...state.conversations],
      currentConversation: conversation,
      messages: []
    }))
    return conversation
  },

  selectConversation: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const [conversation, messages] = await Promise.all([
        conversationApi.getById(id),
        messageApi.getByConversationId(id)
      ])
      set({
        currentConversation: conversation,
        messages,
        isLoading: false
      })
    } catch {
      set({ error: 'Failed to load conversation', isLoading: false })
    }
  },

  updateConversation: async (id, data) => {
    const updated = await conversationApi.update(id, {
      title: data.title ?? undefined,
      model_id: data.model_id ?? undefined,
      system_prompt: data.system_prompt ?? undefined
    })
    set(state => ({
      conversations: state.conversations.map(c => c.id === id ? updated : c),
      currentConversation: state.currentConversation?.id === id ? updated : state.currentConversation
    }))
  },

  deleteConversation: async (id) => {
    await conversationApi.delete(id)
    set(state => {
      const conversations = state.conversations.filter(c => c.id !== id)
      const shouldSelectNew = state.currentConversation?.id === id
      return {
        conversations,
        currentConversation: shouldSelectNew ? conversations[0] || null : state.currentConversation,
        messages: shouldSelectNew ? [] : state.messages
      }
    })
    const newState = useConversationStore.getState()
    if (newState.currentConversation && newState.messages.length === 0) {
      await useConversationStore.getState().selectConversation(newState.currentConversation.id)
    }
  },

  addMessage: async (conversationId, messageData) => {
    const message = await messageApi.create(conversationId, {
      role: messageData.role,
      content: messageData.content,
      model_id: messageData.model_id ?? undefined,
      tokens_used: messageData.tokens_used ?? undefined
    })
    set(state => ({
      messages: [...state.messages, message]
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
  }
}))
