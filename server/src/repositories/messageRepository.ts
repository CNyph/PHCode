import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run } from './database.js'
import type { Message, CreateMessageRequest } from '../models/types.js'
import { touchConversation } from './conversationRepository.js'

export function getMessagesByConversationId(conversationId: string, branchId?: string, userId?: string): Message[] {
  if (branchId) {
    return queryAll<Message>(
      'SELECT * FROM messages WHERE conversation_id = ? AND branch_id = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at ASC',
      [conversationId, branchId, userId || null]
    )
  }
  return queryAll<Message>(
    'SELECT * FROM messages WHERE conversation_id = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at ASC',
    [conversationId, userId || null]
  )
}

export function getMessagesByBranch(conversationId: string, branchId: string, userId?: string): Message[] {
  return queryAll<Message>(
    `WITH RECURSIVE branch_chain(id) AS (
       SELECT id FROM messages WHERE conversation_id = ? AND branch_id = ? AND (user_id = ? OR user_id IS NULL)
       UNION ALL
       SELECT m.id FROM messages m
       INNER JOIN branch_chain bc ON m.id = (
         SELECT parent_message_id FROM messages WHERE id = bc.id AND parent_message_id IS NOT NULL
       )
     )
     SELECT * FROM messages WHERE id IN (SELECT id FROM branch_chain) ORDER BY created_at ASC`,
    [conversationId, branchId, userId || null]
  )
}

export function getMessageById(id: string, userId?: string): Message | undefined {
  return queryOne<Message>(
    'SELECT * FROM messages WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
    [id, userId || null]
  )
}

export function getBranches(conversationId: string, userId?: string): Array<{ branch_id: string; count: number }> {
  return queryAll<{ branch_id: string; count: number }>(
    'SELECT branch_id, COUNT(*) as count FROM messages WHERE conversation_id = ? AND (user_id = ? OR user_id IS NULL) GROUP BY branch_id',
    [conversationId, userId || null]
  )
}

export function createMessage(conversationId: string, data: CreateMessageRequest, userId?: string): Message {
  const id = uuidv4()
  const now = new Date().toISOString()
  const branchId = data.branch_id || 'main'

  run(
    'INSERT INTO messages (id, user_id, conversation_id, parent_message_id, branch_id, role, content, model_id, tokens_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId || null, conversationId, data.parent_message_id || null, branchId, data.role, data.content, data.model_id || null, data.tokens_used || 0, now]
  )

  touchConversation(conversationId)

  return getMessageById(id, userId)!
}

export function updateMessage(id: string, content: string, userId?: string): Message | null {
  const existing = getMessageById(id, userId)
  if (!existing) return null

  if (userId) {
    run('UPDATE messages SET content = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [content, id, userId])
  } else {
    run('UPDATE messages SET content = ? WHERE id = ?', [content, id])
  }

  touchConversation(existing.conversation_id)

  return getMessageById(id, userId)!
}

export function deleteMessage(id: string, userId?: string): boolean {
  const existing = getMessageById(id, userId)
  if (!existing) return false

  if (userId) {
    run('DELETE FROM messages WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId])
  } else {
    run('DELETE FROM messages WHERE id = ?', [id])
  }

  touchConversation(existing.conversation_id)

  return true
}

export function getMessageCount(conversationId: string, userId?: string): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND (user_id = ? OR user_id IS NULL)',
    [conversationId, userId || null]
  )
  return result?.count || 0
}
