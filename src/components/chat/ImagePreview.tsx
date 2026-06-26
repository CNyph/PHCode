import { useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
}

export default function ImagePreview({ src, alt, className = '' }: ImagePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <img
        src={src}
        alt={alt || '图片'}
        className={`rounded-lg cursor-pointer transition-opacity hover:opacity-90 max-w-[200px] max-h-[150px] object-cover ${className}`}
        onClick={() => setIsExpanded(true)}
      />

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-4 right-4 p-2 rounded-full transition-colors"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#fff' }}
              >
                <X size={20} />
              </button>
              <img
                src={src}
                alt={alt || '图片'}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
