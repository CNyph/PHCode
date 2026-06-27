import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getAllKnowledgeBases,
  getKnowledgeBaseById,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getDocumentsByKnowledgeBaseId,
  createDocument,
  deleteDocument
} from '../repositories/knowledgeRepository.js'

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:5000').trim()

export const knowledgeRoutes = Router()

knowledgeRoutes.use(requireAuth)

knowledgeRoutes.get('/', (req, res) => {
  const bases = getAllKnowledgeBases(req.authUser!.id)
  res.json(bases)
})

knowledgeRoutes.get('/:id', (req, res) => {
  const base = getKnowledgeBaseById(req.params.id, req.authUser!.id)
  if (!base) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }
  res.json(base)
})

knowledgeRoutes.post('/', (req, res) => {
  const { name, description } = req.body
  if (!name) {
    res.status(400).json({ error: '名称不能为空' })
    return
  }

  const base = createKnowledgeBase(name, description, req.authUser!.id)
  res.status(201).json(base)
})

knowledgeRoutes.put('/:id', (req, res) => {
  const { name, description } = req.body
  const base = updateKnowledgeBase(req.params.id, { name, description }, req.authUser!.id)
  if (!base) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }
  res.json(base)
})

knowledgeRoutes.delete('/:id', (req, res) => {
  const deleted = deleteKnowledgeBase(req.params.id, req.authUser!.id)
  if (!deleted) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }
  res.status(204).send()
})

knowledgeRoutes.get('/:id/documents', (req, res) => {
  const documents = getDocumentsByKnowledgeBaseId(req.params.id, req.authUser!.id)
  res.json(documents)
})

knowledgeRoutes.post('/:id/documents', (req, res) => {
  const { filename, file_path, file_type, content } = req.body
  if (!filename || !file_path) {
    res.status(400).json({ error: '文件名和路径不能为空' })
    return
  }

  const doc = createDocument(req.params.id, { filename, file_path, file_type, content }, req.authUser!.id)
  res.status(201).json(doc)
})

knowledgeRoutes.delete('/:id/documents/:docId', (req, res) => {
  const deleted = deleteDocument(req.params.docId, req.params.id, req.authUser!.id)
  if (!deleted) {
    res.status(404).json({ error: '文档不存在' })
    return
  }
  res.status(204).send()
})

knowledgeRoutes.post('/:id/search', async (req, res) => {
  const { query, top_k } = req.body
  if (!query) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const base = getKnowledgeBaseById(req.params.id, req.authUser!.id)
  if (!base) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }

  const documents = getDocumentsByKnowledgeBaseId(req.params.id, req.authUser!.id)
  const docsForSearch = documents.map(d => ({
    document_id: d.id,
    filename: d.filename,
    content: d.content,
    embedding: d.embedding ? JSON.parse(d.embedding as unknown as string) : []
  }))

  try {
    const response = await fetch(`${AI_SERVICE_URL}/v1/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents: docsForSearch, top_k: top_k || 5 })
    })

    if (!response.ok) {
      res.status(response.status).json({ error: 'RAG search failed' })
      return
    }

    const result = await response.json()
    res.json(result)
  } catch (error) {
    res.status(502).json({ error: '无法连接到 AI 服务' })
  }
})
