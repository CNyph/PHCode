import { Router } from 'express'
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

export const knowledgeRoutes = Router()

knowledgeRoutes.get('/', (_req, res) => {
  const bases = getAllKnowledgeBases()
  res.json(bases)
})

knowledgeRoutes.get('/:id', (req, res) => {
  const base = getKnowledgeBaseById(req.params.id)
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

  const base = createKnowledgeBase(name, description)
  res.status(201).json(base)
})

knowledgeRoutes.put('/:id', (req, res) => {
  const { name, description } = req.body
  const base = updateKnowledgeBase(req.params.id, { name, description })
  if (!base) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }
  res.json(base)
})

knowledgeRoutes.delete('/:id', (req, res) => {
  const deleted = deleteKnowledgeBase(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: '知识库不存在' })
    return
  }
  res.status(204).send()
})

knowledgeRoutes.get('/:id/documents', (req, res) => {
  const documents = getDocumentsByKnowledgeBaseId(req.params.id)
  res.json(documents)
})

knowledgeRoutes.post('/:id/documents', (req, res) => {
  const { filename, file_path, file_type, content } = req.body
  if (!filename || !file_path) {
    res.status(400).json({ error: '文件名和路径不能为空' })
    return
  }

  const doc = createDocument(req.params.id, { filename, file_path, file_type, content })
  res.status(201).json(doc)
})

knowledgeRoutes.delete('/:id/documents/:docId', (req, res) => {
  const deleted = deleteDocument(req.params.docId, req.params.id)
  if (!deleted) {
    res.status(404).json({ error: '文档不存在' })
    return
  }
  res.status(204).send()
})
