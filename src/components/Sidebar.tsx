import { useEffect, useState, useRef, useMemo } from 'react'
import { Plus, MessageSquare, Settings, Trash2, Check, X, Sun, Moon, Search, Download, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConversationStore } from '../stores/conversationStore'
import { useTheme } from '../contexts/ThemeContext'
import { exportToJson, downloadFile, importFromJson } from '../services/exportService'

interface SidebarProps {
  onSettingsClick: () => void
  onNewChat: () => void
}

export default function Sidebar({ onSettingsClick, onNewChat }: SidebarProps) {
  const {
    conversations,
    currentConversation,
    fetchConversations,
    selectConversation,
    updateConversation,
    deleteConversation
  } = useConversationStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme, toggleTheme } = useTheme()

  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { conversations: importedConvs } = await importFromJson(file)
      for (const conv of importedConvs) {
        await useConversationStore.getState().createConversation(conv.title, conv.model_id || undefined)
      }
      await fetchConversations()
    } catch (err) {
      console.error('导入失败:', err)
    }
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const query = searchQuery.toLowerCase()
    return conversations.filter(chat =>
      chat.title.toLowerCase().includes(query)
    )
  }, [conversations, searchQuery])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleNewChat = async () => {
    await onNewChat()
  }

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditingTitle(currentTitle)
  }

  const handleConfirmRename = async () => {
    if (editingId && editingTitle.trim()) {
      await updateConversation(editingId, { title: editingTitle.trim() })
    }
    setEditingId(null)
    setEditingTitle('')
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteConversation(id)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  return (
    <div
      className="flex flex-col h-full w-[280px] overflow-hidden"
      style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)' }}
    >
      <div className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-160 hover:scale-[0.98] active:scale-[0.96]"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
        >
          <Plus size={16} />
          新建对话
        </button>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--input-bg)',
            border: '1px solid var(--input-border)'
          }}
        >
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
          {filteredConversations.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
              onMouseEnter={() => setHoveredId(chat.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {editingId === chat.id ? (
                <div
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-active)' }}
                >
                  <input
                    ref={inputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleConfirmRename}
                    className="flex-1 bg-transparent outline-none text-sm px-1"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleConfirmRename}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={handleCancelRename}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => selectConversation(chat.id)}
                  onDoubleClick={() => handleStartRename(chat.id, chat.title)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors duration-160 cursor-pointer"
                  style={{
                    backgroundColor: currentConversation?.id === chat.id ? 'var(--bg-active)' : 'transparent',
                    color: currentConversation?.id === chat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentConversation?.id !== chat.id) {
                      e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentConversation?.id !== chat.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <MessageSquare size={14} className="flex-shrink-0" />
                  <span className="truncate flex-1">{chat.title || '新对话'}</span>
                  <AnimatePresence>
                    {hoveredId === chat.id && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => handleDelete(e, chat.id)}
                        className="flex-shrink-0 p-1 rounded transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ))}
          {filteredConversations.length === 0 && searchQuery && (
            <div className="px-3 py-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
              未找到对话
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-160 flex-1"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-160"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="导入聊天记录"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={async () => {
              if (conversations.length === 0) return
              const allMessages = []
              for (const conv of conversations) {
                const msgs = await useConversationStore.getState().getMessages(conv.id)
                allMessages.push(...msgs)
              }
              if (allMessages.length > 0) {
                const json = exportToJson(conversations, allMessages)
                downloadFile(json, `phcode-export-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-160"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="导出聊天记录"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-160"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
