import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run, getDatabase } from './database.js'
import type { KnowledgeBase, KnowledgeDocument } from '../models/types.js'

export function getAllKnowledgeBases(userId?: string): KnowledgeBase[] {
  return queryAll<KnowledgeBase>(
    'SELECT * FROM knowledge_bases WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
    [userId || null]
  )
}

export function getKnowledgeBaseById(id: string, userId?: string): KnowledgeBase | undefined {
  return queryOne<KnowledgeBase>(
    'SELECT * FROM knowledge_bases WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
    [id, userId || null]
  )
}

export function createKnowledgeBase(name: string, description?: string, userId?: string): KnowledgeBase {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO knowledge_bases (id, user_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId || null, name, description || '', now]
  )

  return getKnowledgeBaseById(id, userId)!
}

export function updateKnowledgeBase(id: string, data: { name?: string; description?: string }, userId?: string): KnowledgeBase | null {
  const existing = getKnowledgeBaseById(id, userId)
  if (!existing) return null

  if (userId) {
    run(
      'UPDATE knowledge_bases SET name = ?, description = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [data.name || existing.name, data.description ?? existing.description, id, userId]
    )
  } else {
    run(
      'UPDATE knowledge_bases SET name = ?, description = ? WHERE id = ?',
      [data.name || existing.name, data.description ?? existing.description, id]
    )
  }

  return getKnowledgeBaseById(id, userId)!
}

export function deleteKnowledgeBase(id: string, userId?: string): boolean {
  const existing = getKnowledgeBaseById(id, userId)
  if (!existing) return false

  const db = getDatabase()
  db.run('BEGIN TRANSACTION')
  try {
    if (userId) {
      db.run('DELETE FROM knowledge_documents WHERE knowledge_base_id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId])
      db.run('DELETE FROM knowledge_bases WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, userId])
    } else {
      db.run('DELETE FROM knowledge_documents WHERE knowledge_base_id = ?', [id])
      db.run('DELETE FROM knowledge_bases WHERE id = ?', [id])
    }
    db.run('COMMIT')
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }

  return true
}

export function getDocumentsByKnowledgeBaseId(knowledgeBaseId: string, userId?: string): KnowledgeDocument[] {
  return queryAll<KnowledgeDocument>(
    'SELECT * FROM knowledge_documents WHERE knowledge_base_id = ? AND (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC',
    [knowledgeBaseId, userId || null]
  )
}

export function getDocumentById(id: string, knowledgeBaseId: string, userId?: string): KnowledgeDocument | undefined {
  return queryOne<KnowledgeDocument>(
    'SELECT * FROM knowledge_documents WHERE id = ? AND knowledge_base_id = ? AND (user_id = ? OR user_id IS NULL)',
    [id, knowledgeBaseId, userId || null]
  )
}

export function createDocument(knowledgeBaseId: string, data: {
  filename: string
  file_path: string
  file_type?: string
  content?: string
}, userId?: string): KnowledgeDocument {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO knowledge_documents (id, user_id, knowledge_base_id, filename, file_path, file_type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId || null, knowledgeBaseId, data.filename, data.file_path, data.file_type || 'text/plain', data.content || '', now]
  )

  return { id, knowledge_base_id: knowledgeBaseId, ...data, file_type: data.file_type || 'text/plain', content: data.content || '', embedding: null, created_at: now }
}

export function deleteDocument(id: string, knowledgeBaseId: string, userId?: string): boolean {
  const existing = getDocumentById(id, knowledgeBaseId, userId)
  if (!existing) return false

  if (userId) {
    run('DELETE FROM knowledge_documents WHERE id = ? AND knowledge_base_id = ? AND (user_id = ? OR user_id IS NULL)', [id, knowledgeBaseId, userId])
  } else {
    run('DELETE FROM knowledge_documents WHERE id = ?', [id])
  }
  return true
}
