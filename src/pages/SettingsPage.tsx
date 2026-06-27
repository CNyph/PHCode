import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Code2,
  FileText,
  Globe,
  Loader2,
  Save,
  Sparkles,
  SquareDashedBottomCode,
  ToggleLeft,
  ToggleRight,
  User,
  Zap,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { authApi, chatApi, knowledgeApi } from '../services/api'
import { STORAGE_KEYS, DEFAULT_MODEL } from '../types/api'
import type { ModelInfo } from '../types/api'
import KnowledgeBasePage from './KnowledgeBasePage'
import PromptLibraryPage from './PromptLibraryPage'
import Avatar from '../components/Avatar'
import { useChatStore } from '../stores/chatStore'
import { getCurrentUserId, getScopedStorageKey } from '../services/session'

interface SettingsData {
  defaultModel: string
  ollamaUrl: string
  serverUrl: string
  aiServiceUrl: string
  userName: string
  userAvatar: string
  temperature: number
  topP: number
  maxTokens: number
  systemPrompt: string
  webSearchEnabled: boolean
  visionEnabled: boolean
  fileToolsEnabled: boolean
  pluginDirectory: string
}

type Tab =
  | 'general'
  | 'models'
  | 'tuning'
  | 'diagnostics'
  | 'tools'
  | 'plugins'
  | 'knowledge'
  | 'prompts'
  | 'about'

type DiagnosticsState = {
  server: 'checking' | 'ok' | 'error'
  auth: 'checking' | 'ok' | 'error'
  models: 'checking' | 'ok' | 'error'
  knowledge: 'checking' | 'ok' | 'error'
  summary: string
}

const defaultSettings: SettingsData = {
  defaultModel: DEFAULT_MODEL,
  ollamaUrl: '',
  serverUrl: 'http://localhost:3000',
  aiServiceUrl: 'http://localhost:8000',
  userName: '',
  userAvatar: '',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1024,
  systemPrompt: '',
  webSearchEnabled: false,
  visionEnabled: false,
  fileToolsEnabled: true,
  pluginDirectory: '',
}

function loadSettings(): SettingsData {
  try {
    const saved = localStorage.getItem(
      getScopedStorageKey(STORAGE_KEYS.SETTINGS, getCurrentUserId()),
    )
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
    >
      {children}
    </span>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-3xl p-5 md:p-6 space-y-5"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
        {hint && (
          <p className="text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
            {hint}
          </p>
        )}
      </div>
      <div className="w-full md:w-auto">{children}</div>
    </div>
  )
}

function Toggle({
  enabled,
  onToggle,
  label,
  hint,
}: {
  enabled: boolean
  onToggle: () => void
  label: string
  hint?: string
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        {hint && (
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
            {hint}
          </p>
        )}
      </div>
      {enabled ? (
        <ToggleRight size={22} style={{ color: 'var(--accent)' }} />
      ) : (
        <ToggleLeft size={22} style={{ color: 'var(--text-tertiary)' }} />
      )}
    </button>
  )
}

function RangeRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  suffix?: string
  hint?: string
}) {
  return (
    <div className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          {hint && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {hint}
            </p>
          )}
        </div>
        <Pill>
          {value.toFixed(step < 1 ? 1 : 0)}
          {suffix || ''}
        </Pill>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  )
}

function DiagnosticsCard({
  label,
  status,
  description,
  action,
}: {
  label: string
  status: 'checking' | 'ok' | 'error'
  description: string
  action?: React.ReactNode
}) {
  const icon =
    status === 'ok' ? (
      <CheckCircle size={18} style={{ color: '#22c55e' }} />
    ) : status === 'error' ? (
      <SquareDashedBottomCode size={18} style={{ color: '#ef4444' }} />
    ) : (
      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
    )

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {label}
            </p>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}

export default function SettingsPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const { theme, setTheme } = useTheme()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [detectedOllamaUrl, setDetectedOllamaUrl] = useState('')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>(
    'checking',
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [settings, setSettings] = useState<SettingsData>(loadSettings)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    server: 'checking',
    auth: 'checking',
    models: 'checking',
    knowledge: 'checking',
    summary: '准备运行诊断',
  })
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const {
    setSelectedModel,
    setTemperature,
    setTopP,
    setMaxTokens,
    setSystemPrompt,
    setWebSearchEnabled,
  } = useChatStore()

  const runDiagnostics = async () => {
    setDiagnostics({
      server: 'checking',
      auth: 'checking',
      models: 'checking',
      knowledge: 'checking',
      summary: '正在检查服务状态…',
    })

    const [serverResult, authResult, modelResult, knowledgeResult] = await Promise.allSettled([
      fetch('http://localhost:3000/api/health').then((r) => r.ok),
      authApi.me().then(() => true),
      chatApi.getModels({ timeout: 8000 }).then((response) => response.data.length >= 0),
      knowledgeApi.getAll().then(() => true),
    ])

    const nextState: DiagnosticsState = {
      server: serverResult.status === 'fulfilled' && serverResult.value ? 'ok' : 'error',
      auth: authResult.status === 'fulfilled' && authResult.value ? 'ok' : 'error',
      models: modelResult.status === 'fulfilled' && modelResult.value ? 'ok' : 'error',
      knowledge: knowledgeResult.status === 'fulfilled' && knowledgeResult.value ? 'ok' : 'error',
      summary: '诊断完成',
    }
    setDiagnostics(nextState)
  }

  const checkOllamaConnection = async () => {
    setOllamaStatus('checking')
    try {
      const response = await chatApi.getModels()
      setDetectedOllamaUrl(response.resolved_ollama_url || settings.ollamaUrl || '')
      setOllamaStatus(response.data.length > 0 ? 'connected' : 'disconnected')
    } catch {
      setDetectedOllamaUrl('')
      setOllamaStatus('disconnected')
    }
  }

  const fetchModels = async () => {
    try {
      const response = await chatApi.getModels()
      setModels(response.data)
      setDetectedOllamaUrl(response.resolved_ollama_url || settings.ollamaUrl || '')
    } catch {
      console.error('Failed to fetch models')
    }
  }

  useEffect(() => {
    const init = async () => {
      await checkOllamaConnection()
      await fetchModels()
      await runDiagnostics()
    }
    void init()
  }, [])

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      localStorage.setItem(
        getScopedStorageKey(STORAGE_KEYS.SETTINGS, getCurrentUserId()),
        JSON.stringify(settings),
      )
      setSelectedModel(settings.defaultModel)
      setTemperature(settings.temperature)
      setTopP(settings.topP)
      setMaxTokens(settings.maxTokens)
      setSystemPrompt(settings.systemPrompt)
      setWebSearchEnabled(settings.webSearchEnabled)
      setSaveMessage('设置保存成功')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setSaveMessage('保存设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: '通用', icon: <User size={14} /> },
    { id: 'models', label: '模型', icon: <BookOpen size={14} /> },
    { id: 'tuning', label: '参数', icon: <Code2 size={14} /> },
    { id: 'diagnostics', label: '诊断', icon: <CheckCircle size={14} /> },
    { id: 'tools', label: '工具', icon: <Zap size={14} /> },
    { id: 'plugins', label: '插件', icon: <Sparkles size={14} /> },
    { id: 'knowledge', label: '知识库', icon: <BookOpen size={14} /> },
    { id: 'prompts', label: 'Prompts', icon: <Sparkles size={14} /> },
    { id: 'about', label: '关于', icon: <FileText size={14} /> },
  ]

  const pluginCards = [
    {
      name: '联网搜索插件',
      description: '为对话提供外部参考来源',
      active: settings.webSearchEnabled,
      icon: <Globe size={16} />,
    },
    {
      name: '文档工具插件',
      description: '支持文件读取与知识库联动',
      active: settings.fileToolsEnabled,
      icon: <FileText size={16} />,
    },
    {
      name: '视觉插件',
      description: '面向图片理解的扩展入口',
      active: settings.visionEnabled,
      icon: <SquareDashedBottomCode size={16} />,
    },
    {
      name: 'Prompt 插件位',
      description: '预留给后续本地插件系统',
      active: true,
      icon: <Sparkles size={16} />,
    },
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
          className="p-1.5 rounded-xl transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            设置
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            本地优先 · 多用户隔离 · 可扩展工具链
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-56 flex flex-col p-3 gap-2 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border-color)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--bg-active)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl space-y-6">
            {activeTab === 'general' && (
              <>
                <Section title="个人信息" subtitle="与你的本地账户同步的头像与名称">
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
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            updateSetting('userAvatar', String(ev.target?.result || ''))
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <User size={12} />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-sm mb-1.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        用户名
                      </label>
                      <input
                        value={settings.userName}
                        onChange={(e) => updateSetting('userName', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-primary)',
                        }}
                        placeholder="输入用户名"
                      />
                    </div>
                  </div>
                </Section>

                <Section title="外观" subtitle="桌面应用的视觉风格">
                  <FieldRow label="主题">
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="dark">深色</option>
                      <option value="light">浅色</option>
                    </select>
                  </FieldRow>
                </Section>

                <Section title="连接" subtitle="Ollama 与本地服务状态">
                  <div className="space-y-4">
                    <FieldRow label="Ollama 状态">
                      <div className="flex items-center gap-2">
                        {ollamaStatus === 'checking' && (
                          <Loader2
                            size={16}
                            className="animate-spin"
                            style={{ color: 'var(--text-tertiary)' }}
                          />
                        )}
                        {ollamaStatus === 'connected' && <Pill>已连接</Pill>}
                        {ollamaStatus === 'disconnected' && <Pill>未连接</Pill>}
                        <button
                          onClick={checkOllamaConnection}
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          刷新
                        </button>
                      </div>
                    </FieldRow>

                    <FieldRow label="当前地址">
                      <span
                        className="text-sm truncate max-w-[340px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {detectedOllamaUrl || '未探测到'}
                      </span>
                    </FieldRow>

                    <FieldRow label="Ollama 地址" hint="留空则自动探测本机地址">
                      <input
                        value={settings.ollamaUrl}
                        onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                        className="w-full md:w-80 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-primary)',
                        }}
                        placeholder="留空自动探测"
                      />
                    </FieldRow>
                  </div>
                </Section>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--bg-primary)',
                      opacity: isSaving ? 0.8 : 1,
                    }}
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    保存更改
                  </button>
                  {saveMessage && (
                    <span
                      className="text-sm"
                      style={{ color: saveMessage.includes('成功') ? '#22c55e' : '#ef4444' }}
                    >
                      {saveMessage}
                    </span>
                  )}
                </div>
              </>
            )}

            {activeTab === 'models' && (
              <>
                <Section title="可用模型" subtitle="从本机 Ollama 自动加载的模型列表">
                  {models.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      未找到模型。请确保 Ollama 正在运行且已安装模型。
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className="rounded-2xl p-4"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {model.id}
                              </p>
                              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {model.owned_by}
                              </p>
                            </div>
                            {settings.defaultModel === model.id && <Pill>默认</Pill>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="安装提示" subtitle="安装新模型的命令入口">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm font-mono"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    ollama pull &lt;model-name&gt;
                  </div>
                </Section>
              </>
            )}

            {activeTab === 'tuning' && (
              <>
                <Section title="模型参数" subtitle="影响生成质量、速度和上下文长度">
                  <div className="space-y-4">
                    <RangeRow
                      label="Temperature"
                      value={settings.temperature}
                      onChange={(value) => updateSetting('temperature', value)}
                      min={0}
                      max={2}
                      step={0.1}
                      hint="越低越稳定，越高越发散"
                    />
                    <RangeRow
                      label="Top-p"
                      value={settings.topP}
                      onChange={(value) => updateSetting('topP', value)}
                      min={0}
                      max={1}
                      step={0.05}
                      hint="控制采样范围"
                    />
                    <RangeRow
                      label="Max Tokens"
                      value={settings.maxTokens}
                      onChange={(value) => updateSetting('maxTokens', value)}
                      min={128}
                      max={8192}
                      step={128}
                      hint="单轮回复最大长度"
                    />
                  </div>
                </Section>

                <Section title="系统提示词" subtitle="每个会话可以使用统一的全局提示模板">
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                    rows={8}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="输入系统提示词..."
                  />
                </Section>
              </>
            )}

            {activeTab === 'diagnostics' && (
              <>
                <Section title="运行诊断" subtitle="快速检查本地服务、模型和认证状态">
                  <div className="grid gap-3">
                    <DiagnosticsCard
                      label="Node.js 服务"
                      status={diagnostics.server}
                      description="检查 `http://localhost:3000/api/health` 是否可用"
                    />
                    <DiagnosticsCard
                      label="登录态"
                      status={diagnostics.auth}
                      description="检查本地账户会话是否有效"
                    />
                    <DiagnosticsCard
                      label="模型列表"
                      status={diagnostics.models}
                      description="检查是否能获取 Ollama 模型"
                    />
                    <DiagnosticsCard
                      label="知识库"
                      status={diagnostics.knowledge}
                      description="检查知识库接口和本地数据库"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={runDiagnostics}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      <CheckCircle size={14} />
                      重新诊断
                    </button>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {diagnostics.summary}
                    </span>
                  </div>
                </Section>
              </>
            )}

            {activeTab === 'tools' && (
              <>
                <Section title="工具实验室" subtitle="为后续多模态与工具调用预留入口">
                  <div className="space-y-3">
                    <Toggle
                      enabled={settings.webSearchEnabled}
                      onToggle={() => updateSetting('webSearchEnabled', !settings.webSearchEnabled)}
                      label="联网搜索"
                      hint="为回答注入外部参考来源"
                    />
                    <Toggle
                      enabled={settings.fileToolsEnabled}
                      onToggle={() => updateSetting('fileToolsEnabled', !settings.fileToolsEnabled)}
                      label="文件工具"
                      hint="启用文档读取、摘要与提取等能力"
                    />
                    <Toggle
                      enabled={settings.visionEnabled}
                      onToggle={() => updateSetting('visionEnabled', !settings.visionEnabled)}
                      label="多模态模式"
                      hint="面向图像理解模型的预留开关"
                    />
                  </div>
                </Section>

                <Section title="工作区布局" subtitle="工具和聊天输入的排版预览">
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ['输入区', '左侧模型、右侧参数、底部输入框'],
                      ['消息区', '卡片化对话、来源列表、操作栏'],
                      ['知识区', '文档上传、搜索、RAG 结果预览'],
                    ].map(([title, desc]) => (
                      <div
                        key={title}
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {title}
                        </p>
                        <p
                          className="mt-1 text-xs leading-5"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {activeTab === 'plugins' && (
              <>
                <Section title="插件中心" subtitle="本地插件架构的可视化壳层，便于后续扩展">
                  <FieldRow label="插件目录" hint="可以指定一个本地插件根目录，用于后续加载扩展">
                    <input
                      value={settings.pluginDirectory}
                      onChange={(e) => updateSetting('pluginDirectory', e.target.value)}
                      className="w-full md:w-96 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                      }}
                      placeholder="例如：F:\\PHCode\\plugins"
                    />
                  </FieldRow>
                </Section>

                <Section title="插件清单" subtitle="预置的功能模块卡片">
                  <div className="grid gap-3 md:grid-cols-2">
                    {pluginCards.map((plugin) => (
                      <div
                        key={plugin.name}
                        className="rounded-2xl p-4"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className="w-10 h-10 rounded-2xl flex items-center justify-center"
                              style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                              {plugin.icon}
                            </span>
                            <div>
                              <p
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {plugin.name}
                              </p>
                              <p
                                className="mt-1 text-xs leading-5"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                {plugin.description}
                              </p>
                            </div>
                          </div>
                          <Pill>{plugin.active ? '启用' : '待启用'}</Pill>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBasePage onBack={() => setActiveTab('general')} />
            )}
            {activeTab === 'prompts' && <PromptLibraryPage />}

            {activeTab === 'about' && (
              <>
                <Section title="PHCode" subtitle="本地优先的 AI 对话应用">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        版本
                      </p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        0.1.0
                      </p>
                    </div>
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        数据策略
                      </p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        本地数据库 + 本地文件 + 本地模型
                      </p>
                    </div>
                  </div>
                </Section>

                <Section title="技术架构" subtitle="整体分层与服务链路">
                  <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p>前端：React + TypeScript + Vite + Tailwind CSS</p>
                    <p>桌面端：Electron</p>
                    <p>后端：Node.js (Express) + Python (FastAPI)</p>
                    <p>AI：Ollama（本地大语言模型）</p>
                    <p>数据：SQLite</p>
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
