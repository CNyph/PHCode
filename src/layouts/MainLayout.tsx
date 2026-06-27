import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TitleBar from '../components/TitleBar'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import InputArea from '../components/InputArea'
import SettingsPage from '../pages/SettingsPage'
import { useConversationStore } from '../stores/conversationStore'

type Page = 'chat' | 'settings'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('chat')
  const { createConversation } = useConversationStore()

  useEffect(() => {
    const { onNewChat, onToggleSidebar, onOpenSettings } = window.electronAPI || {}
    const cleanups: (() => void)[] = []

    if (onNewChat) {
      cleanups.push(
        onNewChat(async () => {
          await createConversation()
          setCurrentPage('chat')
        }),
      )
    }

    if (onToggleSidebar) {
      cleanups.push(
        onToggleSidebar(() => {
          setSidebarOpen((prev) => !prev)
        }),
      )
    }

    if (onOpenSettings) {
      cleanups.push(
        onOpenSettings(() => {
          setCurrentPage('settings')
        }),
      )
    }

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [createConversation])

  const handleNewChat = async () => {
    await createConversation()
    setCurrentPage('chat')
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <TitleBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden flex-shrink-0"
            >
              <Sidebar
                onSettingsClick={() => setCurrentPage('settings')}
                onNewChat={handleNewChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col flex-1 overflow-hidden">
          {currentPage === 'chat' ? (
            <>
              <ChatArea />
              <InputArea />
            </>
          ) : (
            <SettingsPage onBack={() => setCurrentPage('chat')} />
          )}
        </div>
      </div>
    </div>
  )
}
