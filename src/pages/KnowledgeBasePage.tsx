import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { knowledgeApi } from '../services/api'
import type { KnowledgeBase } from '../types/api'

interface KnowledgeBasePageProps {
  onBack: () => void
}

export default function KnowledgeBasePage({ onBack }: KnowledgeBasePageProps) {
  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const fetchBases = async () => {
    setIsLoading(true)
    try {
      const data = await knowledgeApi.getAll()
      setBases(data)
    } catch (error) {
      console.error('鑾峰彇鐭ヨ瘑搴撳け璐?', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await knowledgeApi.getAll()
        if (!cancelled) setBases(data)
      } catch (error) {
        console.error('鑾峰彇鐭ヨ瘑搴撳け璐?', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return

    try {
      await knowledgeApi.create({ name: newName, description: newDescription })
      setShowCreateModal(false)
      setNewName('')
      setNewDescription('')
      await fetchBases()
    } catch (error) {
      console.error('鍒涘缓鐭ヨ瘑搴撳け璐?', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await knowledgeApi.delete(id)
      await fetchBases()
    } catch (error) {
      console.error('鍒犻櫎鐭ヨ瘑搴撳け璐?', error)
    }
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            知识库
          </h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          <Plus size={14} />
          新建知识库
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : bases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} style={{ color: 'var(--text-tertiary)' }} />
            <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              暂无知识库
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              创建第一个知识库
            </button>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {bases.map((base) => (
              <motion.div
                key={base.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <FileText size={20} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {base.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {base.description || '暂无描述'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(base.id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                新建知识库
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    名称
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="输入知识库名称"
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    className="block text-sm mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    描述（可选）
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                    rows={3}
                    placeholder="输入知识库描述"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: newName.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: newName.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
