import { useState } from 'react'
import { Pencil, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react'
import CopyButton from '../ui/CopyButton'
import { authFetch } from '../../services/api'

interface MessageActionsProps {
  content: string
  role: 'user' | 'assistant' | 'system'
  messageId?: string
  feedback?: string | null
  onEdit?: () => void
  onRegenerate?: () => void
}

export default function MessageActions({
  content,
  role,
  messageId,
  feedback,
  onEdit,
  onRegenerate,
}: MessageActionsProps) {
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(feedback || null)
  const actionStyle = { color: 'var(--text-tertiary)', backgroundColor: 'transparent' }
  const actionHoverStyle = { color: 'var(--text-primary)', backgroundColor: 'var(--bg-hover)' }

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (!messageId) return
    const newFeedback = currentFeedback === type ? null : type
    try {
      await authFetch(`http://localhost:3000/api/messages/${messageId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: newFeedback }),
      })
      setCurrentFeedback(newFeedback)
    } catch (err) {
      console.error('Feedback failed:', err)
    }
  }

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton
        text={content}
        size={12}
        className="py-1"
        style={actionStyle}
        hoverStyle={actionHoverStyle}
      />

      {role === 'user' && onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
          style={actionStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, actionHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, actionStyle)}
        >
          <Pencil size={12} /> 编辑
        </button>
      )}

      {role === 'assistant' && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
          style={actionStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, actionHoverStyle)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, actionStyle)}
        >
          <RefreshCw size={12} /> 重新生成
        </button>
      )}

      {role === 'assistant' && messageId && (
        <>
          <button
            onClick={() => handleFeedback('positive')}
            className="p-1 rounded text-xs transition-colors"
            style={
              currentFeedback === 'positive'
                ? { color: '#22c55e', backgroundColor: 'var(--bg-hover)' }
                : actionStyle
            }
            onMouseEnter={(e) => {
              if (currentFeedback !== 'positive')
                Object.assign(e.currentTarget.style, actionHoverStyle)
            }}
            onMouseLeave={(e) => {
              if (currentFeedback !== 'positive') Object.assign(e.currentTarget.style, actionStyle)
            }}
            title="有帮助"
          >
            <ThumbsUp size={12} />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className="p-1 rounded text-xs transition-colors"
            style={
              currentFeedback === 'negative'
                ? { color: '#ef4444', backgroundColor: 'var(--bg-hover)' }
                : actionStyle
            }
            onMouseEnter={(e) => {
              if (currentFeedback !== 'negative')
                Object.assign(e.currentTarget.style, actionHoverStyle)
            }}
            onMouseLeave={(e) => {
              if (currentFeedback !== 'negative') Object.assign(e.currentTarget.style, actionStyle)
            }}
            title="无帮助"
          >
            <ThumbsDown size={12} />
          </button>
        </>
      )}
    </div>
  )
}
