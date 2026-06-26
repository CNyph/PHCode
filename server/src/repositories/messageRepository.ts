import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run } from './database.js'
import type { Message, CreateMessageRequest } from '../models/types.js'
import { touchConversation } from './conversationRepository.js'

export function getMessagesByConversationId(conversationId: string): Message[] {
  return queryAll<Message>(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  )
}

export function getMessageById(id: string): Message | undefined {
  return queryOne<Message>(
    'SELECT * FROM messages WHERE id = ?',
    [id]
  )
}

export function createMessage(conversationId: string, data: CreateMessageRequest): Message {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO messages (id, conversation_id, role, content, model_id, tokens_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, conversationId, data.role, data.content, data.model_id || null, data.tokens_used || 0, now]
  )

  touchConversation(conversationId)

  return getMessageById(id)!
}

export function updateMessage(id: string, content: string): Message | null {
  const existing = getMessageById(id)
  if (!existing) return null

  run('UPDATE messages SET content = ? WHERE id = ?', [content, id])

  touchConversation(existing.conversation_id)

  return getMessageById(id)!
}

export function deleteMessage(id: string): boolean {
  const existing = getMessageById(id)
  if (!existing) return false

  run('DELETE FROM messages WHERE id = ?', [id])

  touchConversation(existing.conversation_id)

  return true
}

export function getMessageCount(conversationId: string): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
    [conversationId]
  )
  return result?.count || 0
}
