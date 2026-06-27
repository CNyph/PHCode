import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useConversationStore } from '../stores/conversationStore'
import { useChatStore } from '../stores/chatStore'
import { messageApi } from '../services/api'
import { STORAGE_KEYS } from '../types/api'
import type { Message } from '../types/api'
import MarkdownRenderer from './chat/MarkdownRenderer'
import MessageActions from './chat/MessageActions'
import BranchSelector from './chat/BranchSelector'
import ImagePreview from './chat/ImagePreview'
import Avatar from './Avatar'
import { getCurrentUserId, getScopedStorageKey } from '../services/session'

const IMAGE_URL_REGEX = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi
const SCROLL_THRESHOLD = 100
const STREAM_DEBOUNCE_MS = 32

function extractImageUrls(content: string): string[] {
  const matches = content.match(IMAGE_URL_REGEX)
  return matches || []
}

function getUserSettings() {
  try {
    const saved = localStorage.getItem(
      getScopedStorageKey(STORAGE_KEYS.SETTINGS, getCurrentUserId()),
    )
    if (saved) {
      const data = JSON.parse(saved)
      return { userName: data.userName || '', userAvatar: data.userAvatar || '' }
    }
  } catch {
    // Ignore
  }
  return { userName: '', userAvatar: '' }
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

interface MessageItemProps {
  message: Message
  isEditing: boolean
  editingContent: string
  onEdit: (id: string, content: string) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditContentChange: (content: string) => void
  onRegenerate: (id: string) => void
  userSettings: { userName: string; userAvatar: string }
}

const MessageItem = memo(function MessageItem({
  message,
  isEditing,
  editingContent,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onEditContentChange,
  onRegenerate,
  userSettings,
}: MessageItemProps) {
  if ((message.role as string) === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 justify-start"
      >
        <div className="flex-shrink-0 mt-1">
          <Avatar name="AI" size={32} />
        </div>
        <div
          className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3"
          style={{
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle size={14} />
            <span>{message.content}</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role !== 'user' && (
        <div className="flex-shrink-0 mt-1">
          <Avatar name="AI" size={32} />
        </div>
      )}
      <div className={`max-w-[75%] ${message.role === 'user' ? 'order-1' : ''}`}>
        {isEditing ? (
          <div
            className="rounded-2xl rounded-br-md px-4 py-3"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <textarea
              value={editingContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="w-full bg-transparent outline-none text-sm resize-none"
              style={{ color: 'var(--text-primary)' }}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={onCancelEdit}
                className="px-3 py-1 rounded text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg-primary)',
                }}
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 ${
              message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
            }`}
            style={{
              backgroundColor: message.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: message.role === 'user' ? 'var(--bg-primary)' : 'var(--text-primary)',
            }}
          >
            {message.role === 'user' ? (
              <div>
                {extractImageUrls(message.content).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {extractImageUrls(message.content).map((url, idx) => (
                      <ImagePreview key={idx} src={url} alt={`图片 ${idx + 1}`} />
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : (
              <div className="text-sm">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] opacity-50">{formatTime(message.created_at)}</span>
              <MessageActions
                content={message.content}
                role={message.role as 'user' | 'assistant'}
                messageId={message.role === 'assistant' ? message.id : undefined}
                feedback={(message as unknown as { feedback?: string | null }).feedback}
                onEdit={
                  message.role === 'user' ? () => onEdit(message.id, message.content) : undefined
                }
                onRegenerate={
                  message.role === 'assistant' ? () => onRegenerate(message.id) : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
      {message.role === 'user' && (
        <div className="flex-shrink-0 mt-1 order-2">
          <Avatar
            src={userSettings.userAvatar}
            name={userSettings.userName || '用户'}
            size={32}
            isUser
          />
        </div>
      )}
    </motion.div>
  )
})

export default function ChatArea() {
  const { messages, currentConversation, isLoading } = useConversationStore()
  const { isStreaming, streamingContent } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [debouncedStreamContent, setDebouncedStreamContent] = useState('')
  const userSettings = useMemo(() => getUserSettings(), [])

  const checkIfNearBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkIfNearBottom, { passive: true })
    return () => el.removeEventListener('scroll', checkIfNearBottom)
  }, [checkIfNearBottom])

  useEffect(() => {
    if (isNearBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, debouncedStreamContent])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStreamContent(streamingContent)
    }, STREAM_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [streamingContent])

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditingContent('')
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (editingMessageId && editingContent.trim()) {
      try {
        await messageApi.update(editingMessageId, editingContent.trim())
        const messageIndex = messages.findIndex((m) => m.id === editingMessageId)
        if (messageIndex >= 0) {
          const updatedMessages = [...messages]
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: editingContent.trim(),
          }
          useConversationStore.setState({ messages: updatedMessages })

          const { createBranch } = useConversationStore.getState()
          createBranch(editingMessageId)
          const { sendMessage } = useChatStore.getState()
          await sendMessage(editingContent.trim())
        }
      } catch (error) {
        console.error('Failed to save edit:', error)
      }
      setEditingMessageId(null)
      setEditingContent('')
    }
  }, [editingMessageId, editingContent, messages])

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex > 0) {
        const previousUserMessage = messages[messageIndex - 1]
        if (previousUserMessage.role === 'user') {
          const { createBranch } = useConversationStore.getState()
          createBranch(messageId)
          const { sendMessage } = useChatStore.getState()
          await sendMessage(previousUserMessage.content)
        }
      }
    },
    [messages],
  )

  const handleEditContentChange = useCallback((content: string) => {
    setEditingContent(content)
  }, [])

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    )
  }

  if (!currentConversation || messages.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4 text-center px-6"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Sparkles size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              今天我能帮你做什么？
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              开始对话或上传文件以开始使用。
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-[840px] mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center">
          <BranchSelector />
        </div>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isEditing={editingMessageId === message.id}
            editingContent={editingContent}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onEditContentChange={handleEditContentChange}
            onRegenerate={handleRegenerate}
            userSettings={userSettings}
          />
        ))}

        {isStreaming && debouncedStreamContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 mt-1">
              <Avatar name="AI" size={32} />
            </div>
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="text-sm">
                <MarkdownRenderer content={debouncedStreamContent} />
              </div>
            </div>
          </motion.div>
        )}

        {isStreaming && !debouncedStreamContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 mt-1">
              <Avatar name="AI" size={32} />
            </div>
            <div
              className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
