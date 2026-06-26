import { v4 as uuidv4 } from 'uuid'
import { queryAll, queryOne, run, getDatabase } from './database.js'
import type { KnowledgeBase, KnowledgeDocument } from '../models/types.js'

export function getAllKnowledgeBases(): KnowledgeBase[] {
  return queryAll<KnowledgeBase>(
    'SELECT * FROM knowledge_bases ORDER BY created_at DESC'
  )
}

export function getKnowledgeBaseById(id: string): KnowledgeBase | undefined {
  return queryOne<KnowledgeBase>(
    'SELECT * FROM knowledge_bases WHERE id = ?',
    [id]
  )
}

export function createKnowledgeBase(name: string, description?: string): KnowledgeBase {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO knowledge_bases (id, name, description, created_at) VALUES (?, ?, ?, ?)',
    [id, name, description || '', now]
  )

  return getKnowledgeBaseById(id)!
}

export function updateKnowledgeBase(id: string, data: { name?: string; description?: string }): KnowledgeBase | null {
  const existing = getKnowledgeBaseById(id)
  if (!existing) return null

  run(
    'UPDATE knowledge_bases SET name = ?, description = ? WHERE id = ?',
    [data.name || existing.name, data.description ?? existing.description, id]
  )

  return getKnowledgeBaseById(id)!
}

export function deleteKnowledgeBase(id: string): boolean {
  const existing = getKnowledgeBaseById(id)
  if (!existing) return false

  const db = getDatabase()
  db.run('BEGIN TRANSACTION')
  try {
    db.run('DELETE FROM knowledge_documents WHERE knowledge_base_id = ?', [id])
    db.run('DELETE FROM knowledge_bases WHERE id = ?', [id])
    db.run('COMMIT')
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }

  return true
}

export function getDocumentsByKnowledgeBaseId(knowledgeBaseId: string): KnowledgeDocument[] {
  return queryAll<KnowledgeDocument>(
    'SELECT * FROM knowledge_documents WHERE knowledge_base_id = ? ORDER BY created_at DESC',
    [knowledgeBaseId]
  )
}

export function getDocumentById(id: string, knowledgeBaseId: string): KnowledgeDocument | undefined {
  return queryOne<KnowledgeDocument>(
    'SELECT * FROM knowledge_documents WHERE id = ? AND knowledge_base_id = ?',
    [id, knowledgeBaseId]
  )
}

export function createDocument(knowledgeBaseId: string, data: {
  filename: string
  file_path: string
  file_type?: string
  content?: string
}): KnowledgeDocument {
  const id = uuidv4()
  const now = new Date().toISOString()

  run(
    'INSERT INTO knowledge_documents (id, knowledge_base_id, filename, file_path, file_type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, knowledgeBaseId, data.filename, data.file_path, data.file_type || 'text/plain', data.content || '', now]
  )

  return { id, knowledge_base_id: knowledgeBaseId, ...data, file_type: data.file_type || 'text/plain', content: data.content || '', created_at: now }
}

export function deleteDocument(id: string, knowledgeBaseId: string): boolean {
  const existing = getDocumentById(id, knowledgeBaseId)
  if (!existing) return false

  run('DELETE FROM knowledge_documents WHERE id = ?', [id])
  return true
}
