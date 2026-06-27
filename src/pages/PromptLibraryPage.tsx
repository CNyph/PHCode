import { useState, useEffect } from 'react'
import { Plus, Search, Tag, Trash2, Edit3, Copy, X } from 'lucide-react'
import { promptApi } from '../services/api'
import type { PromptTemplate } from '../types/api'

const CATEGORIES = ['全部', '翻译', '写作', '编程', '办公']

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [category, setCategory] = useState('全部')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<PromptTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ name: '', content: '', category: '编程' })

  const loadPrompts = async () => {
    const data = await promptApi.getAll()
    setPrompts(data)
  }

  useEffect(() => {
    promptApi.getAll().then((data) => setPrompts(data))
  }, [])

  const filtered = prompts.filter((p) => {
    if (category !== '全部' && p.category !== category) return false
    if (search && !p.name.includes(search) && !p.content.includes(search)) return false
    return true
  })

  const categories = ['全部', ...new Set(prompts.map((p) => p.category))]

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) return
    if (editing) {
      await promptApi.update(editing.id, form)
    } else {
      await promptApi.create(form)
    }
    setForm({ name: '', content: '', category: '编程' })
    setEditing(null)
    setIsCreating(false)
    await loadPrompts()
  }

  const handleDelete = async (id: string) => {
    await promptApi.delete(id)
    await loadPrompts()
  }

  const handleUse = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.content)
  }

  const startEdit = (prompt: PromptTemplate) => {
    setForm({ name: prompt.name, content: prompt.content, category: prompt.category })
    setEditing(prompt)
    setIsCreating(true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Prompt Library
          </h1>
          <button
            onClick={() => {
              setIsCreating(true)
              setEditing(null)
              setForm({ name: '', content: '', category: '编程' })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
          >
            <Plus size={14} />
            新建
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 Prompt..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={{
                backgroundColor: category === c ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: category === c ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {isCreating && (
          <div
            className="p-4 rounded-xl mb-4"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {editing ? '编辑 Prompt' : '新建 Prompt'}
              </span>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditing(null)
                }}
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="名称"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {CATEGORIES.filter((c) => c !== '全部').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Prompt 内容..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none resize-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setEditing(null)
                }}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                保存
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 rounded-xl transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {prompt.name}
                  </span>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                  >
                    <Tag size={8} />
                    {prompt.category}
                  </span>
                  {prompt.is_system ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      内置
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUse(prompt)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="复制到剪贴板"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => startEdit(prompt)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Edit3 size={14} />
                  </button>
                  {!prompt.is_system && (
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <pre
                className="text-xs whitespace-pre-wrap leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {prompt.content}
              </pre>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              暂无 Prompt
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
