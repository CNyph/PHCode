import CopyButton from '../ui/CopyButton'

interface CodeBlockProps {
  language?: string
  children: string
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const copyStyle = { color: 'var(--text-tertiary)' }
  const copyHoverStyle = { color: 'var(--text-primary)' }

  return (
    <div className="relative group my-2 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      {language && (
        <div
          className="flex items-center justify-between px-4 py-1.5 text-xs"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
        >
          <span>{language}</span>
          <CopyButton
            text={children}
            style={copyStyle}
            hoverStyle={copyHoverStyle}
          />
        </div>
      )}
      {!language && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton
            text={children}
            style={{ ...copyStyle, backgroundColor: 'var(--bg-hover)' }}
            hoverStyle={{ ...copyHoverStyle, backgroundColor: 'var(--bg-hover)' }}
          />
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={`language-${language || 'text'}`} style={{ color: 'var(--text-primary)' }}>
          {children}
        </code>
      </pre>
    </div>
  )
}
