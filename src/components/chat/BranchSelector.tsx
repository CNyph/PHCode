import { useState } from 'react'
import { GitBranch, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConversationStore } from '../../stores/conversationStore'

export default function BranchSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { branches, currentBranch, switchBranch } = useConversationStore()

  if (branches.length <= 1) return null

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
      >
        <GitBranch size={12} />
        <span>
          {currentBranch === 'main'
            ? '主分支'
            : `分支 ${branches.findIndex((b) => b.branch_id === currentBranch) + 1}`}
        </span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="p-1">
              {branches.map((branch) => (
                <button
                  key={branch.branch_id}
                  onClick={() => {
                    switchBranch(branch.branch_id)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors"
                  style={{
                    backgroundColor:
                      currentBranch === branch.branch_id ? 'var(--bg-active)' : 'transparent',
                    color:
                      currentBranch === branch.branch_id
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentBranch !== branch.branch_id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentBranch !== branch.branch_id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <GitBranch size={12} />
                  <span className="flex-1">
                    {branch.branch_id === 'main'
                      ? '主分支'
                      : `分支 ${branches.findIndex((b) => b.branch_id === branch.branch_id) + 1}`}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {branch.count} 条
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
