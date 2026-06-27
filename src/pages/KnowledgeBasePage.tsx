import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { authFetch, knowledgeApi } from '../services/api'
import type { KnowledgeBase, KnowledgeDocument } from '../types/api'

interface KnowledgeBasePageProps {
  onBack: () => void
}

function Card({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 transition-colors"
      style={{
        backgroundColor: active ? 'var(--bg-active)' : 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {children}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      {children}
    </span>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-3xl p-5 md:p-6 space-y-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {subtitle}
        </p>
      </div>
      {children}
    </section>
  )
}

export default function KnowledgeBasePage({ onBack }: KnowledgeBasePageProps) {
  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{ content: string; score: number; document_id: string }>
  >([])
  const [searchContext, setSearchContext] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [documentQuery, setDocumentQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBase = useMemo(
    () => bases.find((item) => item.id === selectedBaseId) || null,
    [bases, selectedBaseId],
  )

  const fetchDocuments = async (baseId: string) => {
    try {
      const data = await knowledgeApi.getDocuments(baseId)
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadBases = async () => {
      setIsLoading(true)
      try {
        const data = await knowledgeApi.getAll()
        if (cancelled) return
        setBases(data)
        setSelectedBaseId((current) => current || data[0]?.id || null)
      } catch (error) {
        console.error('Failed to load knowledge bases:', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadBases()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedBaseId) {
      return
    }

    let cancelled = false

    const loadDocuments = async () => {
      try {
        const data = await knowledgeApi.getDocuments(selectedBaseId)
        if (!cancelled) {
          setDocuments(data)
        }
      } catch (error) {
        console.error('Failed to load documents:', error)
        if (!cancelled) {
          setDocuments([])
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [selectedBaseId])

  const handleCreate = async () => {
    if (!newName.trim()) return

    try {
      const base = await knowledgeApi.create({
        name: newName.trim(),
        description: newDescription.trim(),
      })
      setBases((prev) => [base, ...prev])
      setSelectedBaseId(base.id)
      setShowCreateModal(false)
      setNewName('')
      setNewDescription('')
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
    }
  }

  const handleDeleteBase = async (id: string) => {
    try {
      await knowledgeApi.delete(id)
      setBases((prev) => prev.filter((item) => item.id !== id))
      if (selectedBaseId === id) {
        setSelectedBaseId(null)
        setDocuments([])
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error)
    }
  }

  const handleUploadDocuments = async (files: FileList | null) => {
    if (!selectedBaseId || !files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))

      const response = await authFetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = (await response.json()) as {
        files: Array<{
          filename: string
          path: string
          mimetype: string
          textContent?: string
          url: string
        }>
      }

      for (const file of result.files) {
        await knowledgeApi.addDocument(selectedBaseId, {
          filename: file.filename,
          file_path: file.path,
          file_type: file.mimetype,
          content: file.textContent || '',
        })
      }

      await fetchDocuments(selectedBaseId)
    } catch (error) {
      console.error('Failed to upload documents:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSearch = async () => {
    if (!selectedBaseId || !documentQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await knowledgeApi.search(selectedBaseId, documentQuery.trim())
      setSearchResults(result.results)
      setSearchContext(result.context)
    } catch (error) {
      console.error('Failed to search knowledge base:', error)
      setSearchResults([])
      setSearchContext('')
    } finally {
      setIsSearching(false)
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
            className="p-1.5 rounded-xl transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              知识库
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              文档上传、知识检索与上下文预览
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          <Plus size={14} />
          新建知识库
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[320px_1fr] overflow-hidden">
        <div
          className="border-r p-4 overflow-y-auto"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索知识库..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {bases
                  .filter((base) => {
                    if (!searchQuery.trim()) return true
                    const query = searchQuery.toLowerCase()
                    return (
                      base.name.toLowerCase().includes(query) ||
                      base.description.toLowerCase().includes(query)
                    )
                  })
                  .map((base) => (
                    <button
                      key={base.id}
                      onClick={() => setSelectedBaseId(base.id)}
                      className="w-full text-left"
                    >
                      <Card active={selectedBaseId === base.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className="w-10 h-10 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <Database size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {base.name}
                              </p>
                              <p
                                className="mt-1 text-xs leading-5 line-clamp-2"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {base.description || '暂无描述'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Card>
                    </button>
                  ))}

                {!bases.length && (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ border: '1px dashed var(--border-color)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      暂无知识库
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {!selectedBase ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div
                  className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <Database size={24} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <h2 className="mt-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  选择一个知识库
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-tertiary)' }}>
                  创建或选中一个知识库后，可以上传文档、执行检索，并查看上下文命中结果。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {selectedBase.name}
                      </h2>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {documents.length} 文档
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-tertiary)' }}>
                      {selectedBase.description || '暂无描述'}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleDeleteBase(selectedBase.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <SectionBlock
                  title="文档管理"
                  subtitle="上传文件后自动抽取文本并写入知识库"
                  action={
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json"
                        onChange={(e) => void handleUploadDocuments(e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--bg-primary)',
                          opacity: isUploading ? 0.8 : 1,
                        }}
                      >
                        {isUploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        上传文档
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <span
                              className="w-10 h-10 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              <FileText size={18} style={{ color: 'var(--text-tertiary)' }} />
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {doc.filename}
                              </p>
                              <p
                                className="mt-1 text-xs truncate"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {doc.file_type} · {doc.file_path}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await knowledgeApi.deleteDocument(selectedBase.id, doc.id)
                              await fetchDocuments(selectedBase.id)
                            }}
                            className="p-2 rounded-xl transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Card>
                    ))}

                    {!documents.length && (
                      <div
                        className="rounded-2xl p-8 text-center"
                        style={{ border: '1px dashed var(--border-color)' }}
                      >
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                          暂无文档，上传后即可检索。
                        </p>
                      </div>
                    )}
                  </div>
                </SectionBlock>

                <SectionBlock title="知识检索" subtitle="输入问题，查看命中片段与上下文">
                  <div className="space-y-3">
                    <textarea
                      value={documentQuery}
                      onChange={(e) => setDocumentQuery(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="输入要检索的问题..."
                    />
                    <button
                      onClick={() => void handleSearch()}
                      disabled={isSearching || !documentQuery.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                      style={{
                        backgroundColor: documentQuery.trim()
                          ? 'var(--accent)'
                          : 'var(--bg-tertiary)',
                        color: documentQuery.trim() ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {isSearching ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Search size={14} />
                      )}
                      检索
                    </button>

                    {searchContext && (
                      <div
                        className="rounded-2xl p-4"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <p
                          className="text-xs uppercase tracking-[0.2em]"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Context
                        </p>
                        <p
                          className="mt-3 text-sm leading-6 whitespace-pre-wrap"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {searchContext}
                        </p>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        {searchResults.map((result, index) => (
                          <div
                            key={`${result.document_id}-${index}`}
                            className="rounded-2xl p-4"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <Pill>命中 #{index + 1}</Pill>
                              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                分数 {result.score.toFixed(3)}
                              </span>
                            </div>
                            <p
                              className="mt-3 text-sm leading-6 whitespace-pre-wrap"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {result.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionBlock>
              </div>
            </div>
          )}
        </div>
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
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl p-6"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                新建知识库
              </h2>
              <div className="space-y-4 mt-4">
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
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
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
                    className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)',
                    }}
                    rows={4}
                    placeholder="输入知识库描述"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button
                  onClick={() => void handleCreate()}
                  disabled={!newName.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium"
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

function SectionBlock({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Section title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {action && <div className="flex justify-end">{action}</div>}
        {children}
      </div>
    </Section>
  )
}
