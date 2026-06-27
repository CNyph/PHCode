import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'

export default function WebSearchSourcesCard() {
  const { webSearchSources } = useChatStore()
  const [expanded, setExpanded] = useState(false)

  const topSources = useMemo(() => webSearchSources.slice(0, 5), [webSearchSources])

  if (topSources.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          </span>
          <div>
            <p className="text-sm font-medium">联网来源</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {topSources.length} 条参考结果
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {topSources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl px-3 py-3 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {source.title}
                      </p>
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {source.url}
                      </p>
                      <p
                        className="text-xs mt-2 leading-5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {source.snippet || '无摘要'}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
