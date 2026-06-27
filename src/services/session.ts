import { STORAGE_KEYS } from '../types/api'
import type { AuthResponse, AuthUser } from '../types/api'

export function loadAuthSession(): AuthResponse | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH)
    if (!saved) return null
    const parsed = JSON.parse(saved) as Partial<AuthResponse>
    if (!parsed.token || !parsed.user?.id) return null
    return {
      token: parsed.token,
      user: parsed.user as AuthUser,
    }
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthResponse | null): void {
  if (typeof window === 'undefined') return
  if (!session) {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    return
  }
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session))
}

export function getCurrentUserId(): string | null {
  return loadAuthSession()?.user.id || null
}

export function getScopedStorageKey(baseKey: string, userId?: string | null): string {
  return userId ? `${baseKey}:${userId}` : `${baseKey}:guest`
}
