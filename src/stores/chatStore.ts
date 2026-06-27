import { create } from 'zustand'
import { chatApi } from '../services/api'
import { useConversationStore } from './conversationStore'
import { STORAGE_KEYS, DEFAULT_MODEL } from '../types/api'
import type { Message } from '../types/api'
import { getCurrentUserId, getScopedStorageKey } from '../services/session'

type WebSearchSource = {
  title: string
  url: string
  snippet: string
}

type ChatSettings = {
  selectedModel: string
  webSearchEnabled: boolean
  temperature: number
  topP: number
  maxTokens: number
  systemPrompt: string
}

function loadSettings(): ChatSettings {
  try {
    const userId = getCurrentUserId()
    const saved = localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.SETTINGS, userId))
    if (saved) {
      const data = JSON.parse(saved)
      return {
        selectedModel: data.selectedModel || DEFAULT_MODEL,
        webSearchEnabled: Boolean(data.webSearchEnabled),
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        topP: typeof data.topP === 'number' ? data.topP : 0.9,
        maxTokens: typeof data.maxTokens === 'number' ? data.maxTokens : 1024,
        systemPrompt: typeof data.systemPrompt === 'string' ? data.systemPrompt : '',
      }
    }
  } catch {
    // Ignore parse errors
  }
  return {
    selectedModel: DEFAULT_MODEL,
    webSearchEnabled: false,
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 1024,
    systemPrompt: '',
  }
}

function saveSettings(patch: Partial<ChatSettings>) {
  try {
    const userId = getCurrentUserId()
    const key = getScopedStorageKey(STORAGE_KEYS.SETTINGS, userId)
    const saved = localStorage.getItem(key)
    const data = saved ? JSON.parse(saved) : {}
    Object.assign(data, patch)
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    const userId = getCurrentUserId()
    const key = getScopedStorageKey(STORAGE_KEYS.SETTINGS, userId)
    localStorage.setItem(key, JSON.stringify(patch))
  }
}

function createAssistantErrorMessage(conversationId: string, content: string): Message {
  return {
    id: `error-${Date.now()}`,
    conversation_id: conversationId,
    parent_message_id: null,
    branch_id: 'main',
    role: 'assistant',
    content,
    model_id: null,
    tokens_used: 0,
    created_at: new Date().toISOString(),
  }
}

function buildNoContentMessage(): string {
  return '模型未返回内容，请确认 Ollama 正在正常运行且所选模型支持对话'
}

const initialSettings = loadSettings()

interface ChatState {
  selectedModel: string | null
  selectedKnowledgeBase: string | null
  webSearchEnabled: boolean
  temperature: number
  topP: number
  maxTokens: number
  systemPrompt: string
  webSearchSources: WebSearchSource[]
  isStreaming: boolean
  streamingContent: string
  abortController: AbortController | null
  lastUserMessage: string | null
  setSelectedModel: (modelId: string) => void
  setSelectedKnowledgeBase: (kbId: string | null) => void
  setWebSearchEnabled: (enabled: boolean) => void
  setTemperature: (value: number) => void
  setTopP: (value: number) => void
  setMaxTokens: (value: number) => void
  setSystemPrompt: (value: string) => void
  setWebSearchSources: (sources: WebSearchSource[]) => void
  reloadSelectedModel: () => void
  stopStreaming: () => void
  sendMessage: (content: string) => Promise<void>
  continueGeneration: () => Promise<void>
}

async function streamAssistantReply(params: {
  conversationId: string
  prompt: string
  modelId: string | undefined
  knowledgeBaseId?: string | null
  webSearchEnabled?: boolean
}) {
  const { conversationId, prompt, modelId, knowledgeBaseId, webSearchEnabled } = params
  const controller = new AbortController()

  useChatStore.setState({
    isStreaming: true,
    streamingContent: '',
    abortController: controller,
  })

  let assistantContent = ''
  let streamError = ''

  try {
    const stream = chatApi.stream(
      conversationId,
      prompt,
      modelId,
      controller.signal,
      knowledgeBaseId || undefined,
      webSearchEnabled,
      {
        temperature: useChatStore.getState().temperature,
        topP: useChatStore.getState().topP,
        maxTokens: useChatStore.getState().maxTokens,
        systemPrompt: useChatStore.getState().systemPrompt,
      },
    )

    for await (const chunk of stream) {
      if (controller.signal.aborted) break

      if (Array.isArray((chunk as { sources?: unknown }).sources)) {
        useChatStore.setState({
          webSearchSources: (chunk as { sources: WebSearchSource[] }).sources || [],
        })
      }

      if (chunk.error) {
        streamError = chunk.error
      } else if (chunk.content) {
        assistantContent += chunk.content
        useChatStore.setState({ streamingContent: assistantContent })
      }
    }

    if (!assistantContent && !streamError && !controller.signal.aborted) {
      streamError = buildNoContentMessage()
    }

    return {
      assistantContent,
      streamError,
      aborted: controller.signal.aborted,
    }
  } finally {
    useChatStore.setState({
      isStreaming: false,
      streamingContent: '',
      abortController: null,
    })
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  selectedModel: initialSettings.selectedModel,
  selectedKnowledgeBase: null,
  webSearchEnabled: initialSettings.webSearchEnabled,
  temperature: initialSettings.temperature,
  topP: initialSettings.topP,
  maxTokens: initialSettings.maxTokens,
  systemPrompt: initialSettings.systemPrompt,
  webSearchSources: [],
  isStreaming: false,
  streamingContent: '',
  abortController: null,
  lastUserMessage: null,

  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId })
    saveSettings({ selectedModel: modelId })
  },

  setSelectedKnowledgeBase: (kbId: string | null) => {
    set({ selectedKnowledgeBase: kbId })
  },

  setWebSearchEnabled: (enabled: boolean) => {
    set({ webSearchEnabled: enabled })
    saveSettings({ webSearchEnabled: enabled })
  },

  setTemperature: (value: number) => {
    set({ temperature: value })
    saveSettings({ temperature: value })
  },

  setTopP: (value: number) => {
    set({ topP: value })
    saveSettings({ topP: value })
  },

  setMaxTokens: (value: number) => {
    set({ maxTokens: value })
    saveSettings({ maxTokens: value })
  },

  setSystemPrompt: (value: string) => {
    set({ systemPrompt: value })
    saveSettings({ systemPrompt: value })
  },

  setWebSearchSources: (sources: WebSearchSource[]) => {
    set({ webSearchSources: sources })
  },

  reloadSelectedModel: () => {
    const settings = loadSettings()
    set({
      selectedModel: settings.selectedModel,
      webSearchEnabled: settings.webSearchEnabled,
      temperature: settings.temperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
      systemPrompt: settings.systemPrompt,
    })
  },

  stopStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ isStreaming: false, abortController: null })
  },

  sendMessage: async (content: string) => {
    const { selectedModel, selectedKnowledgeBase, webSearchEnabled } = get()
    const conversationStore = useConversationStore.getState()
    let conversation = conversationStore.currentConversation

    const messageCount = conversationStore.messages.length

    if (!conversation) {
      conversation = await conversationStore.createConversation(
        undefined,
        selectedModel || undefined,
      )
    }

    await conversationStore.addMessage(conversation.id, {
      conversation_id: conversation.id,
      role: 'user',
      content,
      model_id: selectedModel || conversation.model_id,
      tokens_used: 0,
    })

    if (messageCount === 0) {
      const title = content.slice(0, 30).replace(/\n/g, ' ') + (content.length > 30 ? '...' : '')
      await conversationStore.updateConversation(conversation.id, { title })
    }

    set({
      isStreaming: true,
      streamingContent: '',
      lastUserMessage: content,
      webSearchSources: [],
    })

    try {
      const result = await streamAssistantReply({
        conversationId: conversation.id,
        prompt: content,
        modelId: selectedModel || conversation.model_id || undefined,
        knowledgeBaseId: selectedKnowledgeBase,
        webSearchEnabled,
      })

      if (result.aborted) return

      if (result.assistantContent) {
        await conversationStore.addMessage(conversation.id, {
          conversation_id: conversation.id,
          role: 'assistant',
          content: result.assistantContent,
          model_id: selectedModel || conversation.model_id,
          tokens_used: 0,
        })
        return
      }

      if (result.streamError) {
        useConversationStore.setState((state) => ({
          messages: [
            ...state.messages,
            createAssistantErrorMessage(conversation.id, result.streamError),
          ],
        }))
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user')
        return
      }

      console.error('Stream error:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      useConversationStore.setState((state) => ({
        messages: [
          ...state.messages,
          createAssistantErrorMessage(conversation.id, `请求失败：${errorMessage}`),
        ],
      }))
    } finally {
      set({
        isStreaming: false,
        streamingContent: '',
        abortController: null,
        webSearchSources: [],
      })
    }
  },

  continueGeneration: async () => {
    const { selectedModel, lastUserMessage, streamingContent } = get()
    if (!lastUserMessage) return

    const conversationStore = useConversationStore.getState()
    const conversation = conversationStore.currentConversation
    if (!conversation) return

    const continuationPrompt = `${lastUserMessage}\n\n[继续生成上一次未完成的回答，从以下内容接着写：]\n${streamingContent}`
    set({ isStreaming: true })

    try {
      const result = await streamAssistantReply({
        conversationId: conversation.id,
        prompt: continuationPrompt,
        modelId: selectedModel || conversation.model_id || undefined,
      })

      if (result.aborted) return

      if (result.assistantContent) {
        await conversationStore.addMessage(conversation.id, {
          conversation_id: conversation.id,
          role: 'assistant',
          content: result.assistantContent,
          model_id: selectedModel || conversation.model_id,
          tokens_used: 0,
        })
        return
      }

      if (result.streamError) {
        useConversationStore.setState((state) => ({
          messages: [
            ...state.messages,
            createAssistantErrorMessage(conversation.id, result.streamError),
          ],
        }))
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Continue generation error:', error)
      }
    } finally {
      set({
        isStreaming: false,
        streamingContent: '',
        abortController: null,
        lastUserMessage: null,
        webSearchSources: [],
      })
    }
  },
}))
