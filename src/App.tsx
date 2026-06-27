import { useEffect } from 'react'
import { ToastProvider } from './components/ui/Toast'
import { ThemeProvider } from './contexts/ThemeContext'
import MainLayout from './layouts/MainLayout'
import AuthPage from './pages/AuthPage'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const { user, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <ThemeProvider>
      <ToastProvider>
        {isLoading ? (
          <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              正在加载...
            </div>
          </div>
        ) : user ? (
          <MainLayout />
        ) : (
          <AuthPage />
        )}
      </ToastProvider>
    </ThemeProvider>
  )
}
