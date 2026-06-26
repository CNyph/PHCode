import { Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClipboard } from '../../hooks'

interface CopyButtonProps {
  text: string
  className?: string
  style?: React.CSSProperties
  hoverStyle?: React.CSSProperties
  size?: number
}

export default function CopyButton({
  text,
  className = '',
  style,
  hoverStyle,
  size = 12
}: CopyButtonProps) {
  const { copied, copy } = useClipboard()

  return (
    <button
      onClick={() => copy(text)}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${className}`}
      style={style}
      onMouseEnter={(e) => {
        if (hoverStyle) Object.assign(e.currentTarget.style, hoverStyle)
      }}
      onMouseLeave={(e) => {
        if (style) Object.assign(e.currentTarget.style, style)
      }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <Check size={size} /> 已复制
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <Copy size={size} /> 复制
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
