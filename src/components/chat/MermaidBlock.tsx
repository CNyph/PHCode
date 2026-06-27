import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface MermaidBlockProps {
  code: string
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'sandbox',
        })

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
        const { svg: rendered } = await mermaid.render(id, code.trim())
        if (!cancelled) {
          setSvg(rendered)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '渲染失败')
          setLoading(false)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code])

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 p-4 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Loader2 size={14} className="animate-spin" />
        渲染图表中...
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-start gap-2 p-3 text-sm rounded-lg"
        style={{ backgroundColor: 'var(--bg-error, #fee2e2)', color: 'var(--text-error, #dc2626)' }}
      >
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-medium">图表渲染错误</div>
          <div className="mt-1 opacity-80">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container p-2 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
