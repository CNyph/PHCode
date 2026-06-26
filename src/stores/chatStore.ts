import { create } from 'zustand'
import { chatApi } from '../services/api'
import { useConversationStore } from './conversationStore'
import { STORAGE_KEYS, DEFAULT_MODEL } from '../types/api'
import type { Message } from '../types/api'

function loadSettings(): { selectedModel: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      const data = JSON.parse(saved)
      return { selectedModel: data.selectedModel || DEFAULT_MODEL }
    }
  } catch {
    // Ignore parse errors
  }
  return { selectedModel: DEFAULT_MODEL }
}

function saveModelToSettings(modelId: string) {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    const data = saved ? JSON.parse(saved) : {}
    data.selectedModel = modelId
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data))
  } catch {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ selectedModel: modelId }))
  }
}

const initialSettings = loadSettings()

interface ChatState {
  selectedModel: string | null
  isStreaming: boolean
  streamingContent: string
  abortController: AbortController | null
  setSelectedModel: (modelId: string) => void
  stopStreaming: () => void
  sendMessage: (content: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  selectedModel: initialSettings.selectedModel,
  isStreaming: false,
  streamingContent: '',
  abortController: null,

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId })
    saveModelToSettings(modelId)
  },

  stopStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ isStreaming: false, streamingContent: '', abortController: null })
  },

  sendMessage: async (content: string) => {
    const { selectedModel } = get()
    const conversationStore = useConversationStore.getState()
    let conversation = conversationStore.currentConversation

    const messageCount = conversationStore.messages.length

    if (!conversation) {
      conversation = await conversationStore.createConversation(undefined, selectedModel || undefined)
    }

    await conversationStore.addMessage(conversation.id, {
      conversation_id: conversation.id,
      role: 'user',
      content,
      model_id: selectedModel || conversation.model_id,
      tokens_used: 0
    })

    if (messageCount === 0) {
      const title = content.slice(0, 30).replace(/\n/g, ' ') + (content.length > 30 ? '...' : '')
      await conversationStore.updateConversation(conversation.id, { title })
    }

    const controller = new AbortController()
    set({ isStreaming: true, streamingContent: '', abortController: controller })

    let assistantContent = ''

    try {
      const stream = chatApi.stream(
        conversation.id,
        content,
        selectedModel || conversation.model_id || undefined,
        controller.signal
      )

      for await (const chunk of stream) {
        if (controller.signal.aborted) break
        if (chunk.content) {
          assistantContent += chunk.content
          set({ streamingContent: assistantContent })
        }
      }

      if (assistantContent && !controller.signal.aborted) {
        await conversationStore.addMessage(conversation.id, {
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantContent,
          model_id: selectedModel || conversation.model_id,
          tokens_used: 0
        })
      } else if (!assistantContent && !controller.signal.aborted) {
        const errorId = 'error-' + Date.now()
        const errorMsg: Message = {
          id: errorId,
          conversation_id: conversation.id,
          role: 'assistant' as Message['role'],
          content: 'AI 未返回任何内容。请确认 Ollama 正在运行且模型已安装。',
          model_id: null,
          tokens_used: 0,
          created_at: new Date().toISOString()
        }
        useConversationStore.setState(state => ({
          messages: [...state.messages, errorMsg]
        }))
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user')
      } else {
        console.error('Stream error:', error)
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        const errorId = 'error-' + Date.now()
        const errorMsg: Message = {
          id: errorId,
          conversation_id: conversation.id,
          role: 'error' as Message['role'],
          content: `请求失败：${errorMessage}`,
          model_id: null,
          tokens_used: 0,
          created_at: new Date().toISOString()
        }
        useConversationStore.setState(state => ({
          messages: [...state.messages, errorMsg]
        }))
      }
    } finally {
      set({ isStreaming: false, streamingContent: '', abortController: null })
    }
  }
}))
