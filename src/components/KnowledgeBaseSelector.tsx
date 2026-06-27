import { useState, useEffect, useRef } from 'react'
import { Database, ChevronDown, X } from 'lucide-react'
import { knowledgeApi } from '../services/api'
import type { KnowledgeBase } from '../types/api'
import { useChatStore } from '../stores/chatStore'

export default function KnowledgeBaseSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const { selectedKnowledgeBase, setSelectedKnowledgeBase } = useChatStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    knowledgeApi
      .getAll()
      .then(setKnowledgeBases)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBase)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors"
        style={{
          backgroundColor: selected ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: selected ? 'var(--bg-primary)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
        }}
      >
        <Database size={12} />
        <span>{selected?.name || '知识库'}</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-1 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="p-1">
            <button
              onClick={() => {
                setSelectedKnowledgeBase(null)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors"
              style={{
                backgroundColor: !selectedKnowledgeBase ? 'var(--bg-active)' : 'transparent',
                color: !selectedKnowledgeBase ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (selectedKnowledgeBase) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (selectedKnowledgeBase) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X size={12} />
              <span>无知识库</span>
            </button>
            {knowledgeBases.map((kb) => (
              <button
                key={kb.id}
                onClick={() => {
                  setSelectedKnowledgeBase(kb.id)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors"
                style={{
                  backgroundColor:
                    selectedKnowledgeBase === kb.id ? 'var(--bg-active)' : 'transparent',
                  color:
                    selectedKnowledgeBase === kb.id
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (selectedKnowledgeBase !== kb.id)
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  if (selectedKnowledgeBase !== kb.id)
                    e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Database size={12} />
                <span className="flex-1 truncate">{kb.name}</span>
              </button>
            ))}
            {knowledgeBases.length === 0 && (
              <div
                className="px-3 py-2 text-xs text-center"
                style={{ color: 'var(--text-tertiary)' }}
              >
                暂无知识库
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
