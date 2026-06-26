import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, Square, X, FileText, Image, Thermometer } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import { API_ENDPOINTS } from '../types/api'
import ModelSelector from './ModelSelector'

const API_BASE = 'http://localhost:3000'

interface AttachedFile {
  id: string
  file: File
  preview?: string
}

export default function InputArea() {
  const [input, setInput] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [temperature, setTemperature] = useState(() => {
    try {
      const saved = localStorage.getItem('phcode-temperature')
      return saved ? parseFloat(saved) : 0.7
    } catch {
      return 0.7
    }
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const attachedFilesRef = useRef<AttachedFile[]>([])
  const { sendMessage, isStreaming, stopStreaming, selectedModel, setSelectedModel } = useChatStore()

  useEffect(() => {
    return () => {
      attachedFilesRef.current.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
    }
  }, [])

  useEffect(() => {
    attachedFilesRef.current = attachedFiles
  }, [attachedFiles])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    const response = await fetch(`${API_BASE}${API_ENDPOINTS.UPLOAD}`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('文件上传失败')
    }

    const result = await response.json()
    return result.files.map((f: { url: string }) => f.url)
  }

  const handleSubmit = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isStreaming) return

    let content = input.trim()
    setInput('')

    if (attachedFiles.length > 0) {
      setIsUploading(true)
      try {
        const urls = await uploadFiles(attachedFiles.map(f => f.file))
        const fileRefs = urls.map(u => `\n[附件](${u})`).join('')
        content = content + fileRefs
      } catch {
        content = content || '(文件上传失败)'
      } finally {
        setIsUploading(false)
        attachedFiles.forEach(f => {
          if (f.preview) URL.revokeObjectURL(f.preview)
        })
        setAttachedFiles([])
      }
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setAttachedFiles(prev => [...prev, ...newFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image size={14} />
    }
    return <FileText size={14} />
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    const newFiles: AttachedFile[] = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))
    setAttachedFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleTemperatureChange = useCallback((value: number) => {
    setTemperature(value)
    localStorage.setItem('phcode-temperature', value.toString())
  }, [])

  return (
    <div
      className="flex-shrink-0 px-4 pb-4 pt-2"
      style={{ backgroundColor: 'var(--bg-primary)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: 'var(--accent)'
          }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            拖放文件到此处
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />
        <div className="flex items-center gap-1.5 ml-auto">
          <Thermometer size={12} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            className="w-16 h-1 rounded-full appearance-none cursor-pointer"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            title={`Temperature: ${temperature}`}
          />
          <span className="text-[10px] w-6" style={{ color: 'var(--text-tertiary)' }}>
            {temperature.toFixed(1)}
          </span>
        </div>
      </div>

      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {getFileIcon(file.file)}
                </span>
              )}
              <span className="max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }}>
                {file.file.name}
              </span>
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="p-0.5 rounded"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-end gap-2 rounded-xl px-4 py-3 transition-all duration-160"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.css,.html"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors duration-160"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-5 min-h-[20px] max-h-[200px]"
          style={{ color: 'var(--text-primary)' }}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            onClick={stopStreaming}
            className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-160 hover:scale-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg-primary)'
            }}
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachedFiles.length === 0) || isUploading}
            className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-160 hover:scale-95 active:scale-[0.98]"
            style={{
              backgroundColor: (input.trim() || attachedFiles.length > 0) && !isUploading ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: (input.trim() || attachedFiles.length > 0) && !isUploading ? 'var(--bg-primary)' : 'var(--text-tertiary)',
              opacity: (input.trim() || attachedFiles.length > 0) && !isUploading ? 1 : 0.5
            }}
          >
            <Send size={18} />
          </button>
        )}
      </div>
      <p className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
        AI 可能会犯错，请核实重要信息。
      </p>
    </div>
  )
}
