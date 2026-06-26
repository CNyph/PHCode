import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle, BookOpen, User } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { chatApi } from '../services/api'
import { STORAGE_KEYS, DEFAULT_MODEL } from '../types/api'
import type { ModelInfo } from '../types/api'
import KnowledgeBasePage from './KnowledgeBasePage'
import Avatar from '../components/Avatar'
import { useChatStore } from '../stores/chatStore'

interface SettingsData {
  defaultModel: string
  ollamaUrl: string
  serverUrl: string
  aiServiceUrl: string
  userName: string
  userAvatar: string
}

function loadSettings(): SettingsData {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings
}

const defaultSettings: SettingsData = {
  defaultModel: DEFAULT_MODEL,
  ollamaUrl: 'http://localhost:11434',
  serverUrl: 'http://localhost:3000',
  aiServiceUrl: 'http://localhost:8000',
  userName: '',
  userAvatar: ''
}

interface SettingsPageProps {
  onBack: () => void
}

type Tab = 'general' | 'models' | 'knowledge' | 'about'

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { theme, setTheme } = useTheme()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { setSelectedModel } = useChatStore()

  const checkOllamaConnection = async () => {
    setOllamaStatus('checking')
    try {
      const url = settings.ollamaUrl.replace(/\/+$/, '') + '/api/tags'
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      })
      setOllamaStatus(response.ok ? 'connected' : 'disconnected')
    } catch {
      setOllamaStatus('disconnected')
    }
  }

  const fetchModels = async () => {
    try {
      const response = await chatApi.getModels()
      setModels(response.data)
    } catch {
      console.error('Failed to fetch models')
    }
  }

  useEffect(() => {
    const init = async () => {
      await checkOllamaConnection()
      await fetchModels()
    }
    init()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
      setSelectedModel(settings.defaultModel)
      await fetch(`${settings.serverUrl}/api/settings/defaultModel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: settings.defaultModel })
      })
      setSaveMessage('设置保存成功')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('保存设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: '通用' },
    { id: 'models', label: '模型' },
    { id: 'knowledge', label: '知识库' },
    { id: 'about', label: '关于' }
  ]

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          设置
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-48 flex flex-col p-2 gap-1"
          style={{ borderRight: '1px solid var(--border-color)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {tab.id === 'knowledge' && <BookOpen size={14} />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="max-w-xl space-y-6">
              <Section title="个人信息">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={settings.userAvatar}
                      name={settings.userName || '用户'}
                      size={64}
                      isUser
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            setSettings(prev => ({ ...prev, userAvatar: ev.target?.result as string }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <User size={12} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      用户名
                    </label>
                    <input
                      value={settings.userName}
                      onChange={(e) => setSettings(prev => ({ ...prev, userName: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="输入用户名"
                    />
                  </div>
                </div>
              </Section>

              <Section title="外观">
                <div className="flex items-center justify-between">
                  <Label>主题</Label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="dark">深色</option>
                    <option value="light">浅色</option>
                  </select>
                </div>
              </Section>

              <Section title="默认模型">
                <div className="flex items-center justify-between">
                  <Label>新对话默认模型</Label>
                  <select
                    value={settings.defaultModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultModel: e.target.value }))}
                    className="px-3 py-1.5 rounded-lg text-sm outline-none max-w-[200px]"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {models.length > 0 ? (
                      models.map(model => (
                        <option key={model.id} value={model.id}>{model.id}</option>
                      ))
                    ) : (
                      <option value="llama3.2">llama3.2</option>
                    )}
                  </select>
                </div>
              </Section>

              <Section title="连接">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ollama 状态</Label>
                    <div className="flex items-center gap-2">
                      {ollamaStatus === 'checking' && (
                        <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                      {ollamaStatus === 'connected' && (
                        <div className="flex items-center gap-1.5" style={{ color: '#22c55e' }}>
                          <CheckCircle size={16} />
                          <span className="text-sm">已连接</span>
                        </div>
                      )}
                      {ollamaStatus === 'disconnected' && (
                        <div className="flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                          <XCircle size={16} />
                          <span className="text-sm">未连接</span>
                        </div>
                      )}
                      <button
                        onClick={checkOllamaConnection}
                        className="px-2 py-1 rounded text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        刷新
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Ollama 地址</Label>
                    <input
                      value={settings.ollamaUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg text-sm outline-none w-64"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              </Section>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--bg-primary)'
                  }}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  保存更改
                </button>
                {saveMessage && (
                  <span className="text-sm" style={{ color: saveMessage.includes('成功') ? '#22c55e' : '#ef4444' }}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="max-w-xl space-y-6">
              <Section title="可用模型">
                {models.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    未找到模型。请确保 Ollama 正在运行且已安装模型。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {models.map(model => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between px-4 py-3 rounded-lg"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {model.id}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {model.owned_by}
                          </p>
                        </div>
                        {settings.defaultModel === model.id && (
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--bg-primary)'
                            }}
                          >
                            默认
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="安装新模型">
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  使用 Ollama CLI 安装新模型：
                </p>
                <div
                  className="px-4 py-3 rounded-lg text-sm font-mono"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  ollama pull &lt;model-name&gt;
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBasePage onBack={() => setActiveTab('general')} />
          )}

          {activeTab === 'about' && (
            <div className="max-w-xl space-y-6">
              <Section title="PHCode">
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    版本：0.1.0
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    基于 Ollama 的本地 AI 对话应用。
                  </p>
                </div>
              </Section>

              <Section title="技术架构">
                <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p>前端：React + TypeScript + Vite + Tailwind CSS</p>
                  <p>桌面端：Electron</p>
                  <p>后端：Node.js (Express) + Python (FastAPI)</p>
                  <p>AI：Ollama（本地大语言模型）</p>
                  <p>数据库：SQLite</p>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </label>
  )
}
