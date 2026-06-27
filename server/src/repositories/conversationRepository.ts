import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run } from './database.js'
import type { Conversation, CreateConversationRequest } from '../models/types.js'

export function getAllConversations(userId?: string): Conversation[] {
  if (userId) {
    return queryAll<Conversation>(
      'SELECT * FROM conversations WHERE is_deleted = 0 AND (user_id = ? OR user_id IS NULL) ORDER BY updated_at DESC',
      [userId]
    )
  }
  return queryAll<Conversation>(
    'SELECT * FROM conversations WHERE is_deleted = 0 ORDER BY updated_at DESC'
  )
}

export function getConversationById(id: string, userId?: string): Conversation | undefined {
  if (userId) {
    return queryOne<Conversation>(
      'SELECT * FROM conversations WHERE id = ? AND is_deleted = 0 AND (user_id = ? OR user_id IS NULL)',
      [id, userId]
    )
  }
  return queryOne<Conversation>(
    'SELECT * FROM conversations WHERE id = ? AND is_deleted = 0',
    [id]
  )
}

export function createConversation(data: CreateConversationRequest, userId?: string): Conversation {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO conversations (id, user_id, title, model_id, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId || null, data.title || 'New Chat', data.model_id || null, data.system_prompt || null, now, now]
  )

  return getConversationById(id, userId)!
}

export function updateConversation(id: string, data: Partial<CreateConversationRequest>, userId?: string): Conversation | null {
  const existing = getConversationById(id, userId)
  if (!existing) return null

  const updates: string[] = []
  const values: (string | null)[] = []

  if (data.title !== undefined) {
    updates.push('title = ?')
    values.push(data.title)
  }
  if (data.model_id !== undefined) {
    updates.push('model_id = ?')
    values.push(data.model_id)
  }
  if (data.system_prompt !== undefined) {
    updates.push('system_prompt = ?')
    values.push(data.system_prompt)
  }

  if (updates.length === 0) return existing

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  if (userId) {
    values.push(userId)
    run(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ? AND (user_id = ? OR user_id IS NULL)`, values)
  } else {
    run(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`, values)
  }

  return getConversationById(id, userId)!
}

export function deleteConversation(id: string, userId?: string): boolean {
  const existing = getConversationById(id, userId)
  if (!existing) return false

  if (userId) {
    run('UPDATE conversations SET is_deleted = 1, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [new Date().toISOString(), id, userId])
  } else {
    run('UPDATE conversations SET is_deleted = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), id])
  }
  return true
}

export function touchConversation(id: string): void {
  run('UPDATE conversations SET updated_at = ? WHERE id = ?', [new Date().toISOString(), id])
}
