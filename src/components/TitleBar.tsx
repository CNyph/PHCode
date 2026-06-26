import { PanelLeftClose, PanelLeft, Minus, Square, X } from 'lucide-react'
import Logo from './Logo'

interface TitleBarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function TitleBar({ sidebarOpen, onToggleSidebar }: TitleBarProps) {
  return (
    <div
      className="drag-region flex items-center justify-between h-14 px-3 flex-shrink-0 select-none"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="no-drag p-1 rounded-md transition-colors duration-160 hover:scale-95 active:scale-[0.98]"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>
        <Logo size={20} style={{ color: 'var(--text-primary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          PHCode
        </span>
      </div>
      <div className="flex items-center gap-0.5 no-drag">
        <button
          className="p-1.5 rounded-md transition-colors duration-160"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => window.electronAPI?.minimize()}
        >
          <Minus size={14} />
        </button>
        <button
          className="p-1.5 rounded-md transition-colors duration-160"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => window.electronAPI?.maximize()}
        >
          <Square size={12} />
        </button>
        <button
          className="p-1.5 rounded-md transition-colors duration-160"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e81123'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          onClick={() => window.electronAPI?.close()}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
