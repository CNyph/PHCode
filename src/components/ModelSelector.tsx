import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { chatApi } from '../services/api'
import type { ModelInfo } from '../types/api'

interface ModelSelectorProps {
  selectedModel: string | null
  onSelect: (modelId: string) => void
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [2000, 4000, 8000]

export default function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async (isRetry: boolean) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await chatApi.getModels({ timeout: 15000 })
        if (!cancelled) {
          setModels(response.data)
          retryCount.current = 0
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : '无法加载模型'
        setError(message)
        if (!isRetry && retryCount.current < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount.current]
          retryCount.current++
          retryTimer.current = setTimeout(() => load(true), delay)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load(false)

    return () => {
      cancelled = true
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [refreshKey])

  const handleRefresh = useCallback(() => {
    retryCount.current = 0
    if (retryTimer.current) clearTimeout(retryTimer.current)
    setRefreshKey(k => k + 1)
  }, [])

  const selectedModelInfo = models.find(m => m.id === selectedModel)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{
          backgroundColor: error ? 'var(--bg-error, #fee2e2)' : 'var(--bg-tertiary)',
          color: error ? 'var(--text-error, #dc2626)' : 'var(--text-primary)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = error ? 'var(--bg-error, #fee2e2)' : 'var(--bg-tertiary)')}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : error ? (
          <AlertCircle size={14} />
        ) : (
          <>
            <span className="truncate max-w-[120px]">
              {selectedModelInfo?.id || selectedModel || '选择模型'}
            </span>
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-64 rounded-xl shadow-lg z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div className="max-h-64 overflow-y-auto p-1">
              {error ? (
                <div className="px-3 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle size={14} style={{ color: 'var(--text-error, #dc2626)', marginTop: 2, flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: 'var(--text-error, #dc2626)' }}>
                      {error}
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                  >
                    <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                    重新加载
                  </button>
                </div>
              ) : models.length === 0 ? (
                <div className="px-3 py-2 text-sm flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{isLoading ? '加载模型中...' : '暂无可用模型'}</span>
                  {!isLoading && (
                    <button
                      onClick={handleRefresh}
                      className="p-1 rounded transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
              ) : (
                models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(model.id)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                    style={{
                      backgroundColor: selectedModel === model.id ? 'var(--bg-active)' : 'transparent',
                      color: selectedModel === model.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedModel !== model.id) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedModel !== model.id) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span className="truncate">{model.id}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
