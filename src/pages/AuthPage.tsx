import { useMemo, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Sparkles, User, UserPlus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, register } = useAuthStore()

  const title = useMemo(
    () => (mode === 'login' ? '登录你的本地工作区' : '创建新的本地账户'),
    [mode],
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('用户名和密码不能为空')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password, displayName.trim() || username.trim())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-stretch"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="hidden lg:flex lg:w-[42%] p-8">
        <div
          className="w-full rounded-[28px] p-10 flex flex-col justify-between overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.18))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="space-y-4 max-w-md">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              <Sparkles size={22} style={{ color: '#fff' }} />
            </div>
            <h1
              className="text-4xl font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              PHCode
            </h1>
            <p className="text-base leading-7" style={{ color: 'var(--text-secondary)' }}>
              本地优先的 AI 对话工作台，登录后即可使用你的专属模型、知识库和会话历史。
            </p>
          </div>
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div>• 多用户本地账户</div>
            <div>• 账号隔离的对话与配置</div>
            <div>• 联网搜索与本地知识库联动</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-3xl p-6 lg:p-8 shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="mb-6">
            <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
              欢迎回来
            </p>
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          </div>

          <div
            className="flex gap-2 p-1 rounded-2xl mb-6"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <button
              onClick={() => setMode('login')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'login' ? 'var(--bg-primary)' : 'transparent',
                color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <User size={16} />
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: mode === 'register' ? 'var(--bg-primary)' : 'transparent',
                color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <UserPlus size={16} />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  昵称
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="输入显示名称"
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                用户名
              </label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                }}
              >
                <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="输入用户名"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                密码
              </label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                }}
              >
                <Lock size={16} style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="输入密码"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-transform hover:scale-[0.99] active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-primary)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? '处理中...' : mode === 'login' ? '登录进入' : '创建账户'}
              <ArrowRight size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
