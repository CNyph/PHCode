import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run, getDatabase, flushDatabase } from './database.js'
import type { AuthResponse, AuthUser } from '../models/types.js'

type StoredUser = AuthUser & { password_hash: string }

const PASSWORD_ALGORITHM = 'pbkdf2'
const PASSWORD_ITERATIONS = 120000
const PASSWORD_LENGTH = 64
const PASSWORD_DIGEST = 'sha512'
const SESSION_TTL_DAYS = 30

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_LENGTH, PASSWORD_DIGEST).toString('hex')
  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${salt}$${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== PASSWORD_ALGORITHM) return false

  const [, iterationsText, salt, hash] = parts
  const iterations = Number(iterationsText)
  if (!Number.isFinite(iterations) || !salt || !hash) return false

  const candidate = pbkdf2Sync(password, salt, iterations, hash.length / 2, PASSWORD_DIGEST)
  const storedHash = Buffer.from(hash, 'hex')
  return candidate.length === storedHash.length && timingSafeEqual(candidate, storedHash)
}

function toAuthUser(row: StoredUser): AuthUser {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    avatar_url: row.avatar_url ?? null,
    created_at: row.created_at
  }
}

export function getUserByUsername(username: string): StoredUser | undefined {
  return queryOne<StoredUser>(
    'SELECT id, username, display_name, avatar_url, created_at, password_hash FROM users WHERE LOWER(username) = LOWER(?)',
    [username]
  )
}

export function getUserById(userId: string): AuthUser | undefined {
  const user = queryOne<StoredUser>(
    'SELECT id, username, display_name, avatar_url, created_at, password_hash FROM users WHERE id = ?',
    [userId]
  )
  return user ? toAuthUser(user) : undefined
}

export function createUser(data: { username: string; password: string; displayName?: string; avatarUrl?: string | null }): AuthUser {
  const id = uuidv4()
  const now = new Date().toISOString()
  const passwordHash = hashPassword(data.password)
  const displayName = data.displayName?.trim() || data.username.trim()
  run(
    'INSERT INTO users (id, username, password_hash, display_name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.username.trim(), passwordHash, displayName, data.avatarUrl || null, now]
  )
  return {
    id,
    username: data.username.trim(),
    display_name: displayName,
    avatar_url: data.avatarUrl || null,
    created_at: now
  }
}

export function verifyUserPassword(username: string, password: string): AuthUser | null {
  const user = getUserByUsername(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null
  }
  return toAuthUser(user)
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  run(
    'INSERT INTO auth_sessions (token, user_id, created_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    [token, userId, now.toISOString(), now.toISOString(), expiresAt.toISOString()]
  )

  return token
}

export function getSessionUser(token: string): AuthUser | undefined {
  const session = queryOne<{ token: string; user_id: string; expires_at: string | null }>(
    'SELECT token, user_id, expires_at FROM auth_sessions WHERE token = ?',
    [token]
  )

  if (!session) return undefined
  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(token)
    return undefined
  }

  const user = getUserById(session.user_id)
  if (!user) {
    deleteSession(token)
    return undefined
  }

  run('UPDATE auth_sessions SET last_used_at = ? WHERE token = ?', [new Date().toISOString(), token])
  return user
}

export function deleteSession(token: string): void {
  run('DELETE FROM auth_sessions WHERE token = ?', [token])
}

export function deleteSessionsForUser(userId: string): void {
  run('DELETE FROM auth_sessions WHERE user_id = ?', [userId])
}

export function hasAnyUsers(): boolean {
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users')
  return (result?.count || 0) > 0
}

export function claimLegacyDataForUser(userId: string): void {
  const db = getDatabase()
  db.run('BEGIN TRANSACTION')
  try {
    db.run('UPDATE conversations SET user_id = ? WHERE user_id IS NULL', [userId])
    db.run('UPDATE messages SET user_id = ? WHERE user_id IS NULL', [userId])
    db.run('UPDATE knowledge_bases SET user_id = ? WHERE user_id IS NULL', [userId])
    db.run('UPDATE knowledge_documents SET user_id = ? WHERE user_id IS NULL', [userId])
    db.run('UPDATE prompt_templates SET user_id = ? WHERE user_id IS NULL AND is_system = 0', [userId])
    db.run('COMMIT')
    flushDatabase()
  } catch (error) {
    db.run('ROLLBACK')
    throw error
  }
}

export function createAuthResponse(user: AuthUser): AuthResponse {
  return {
    token: createSession(user.id),
    user
  }
}
