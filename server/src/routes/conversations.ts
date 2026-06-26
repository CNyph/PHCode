import { Router } from 'express'
import {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation
} from '../repositories/conversationRepository.js'
import { getMessagesByConversationId } from '../repositories/messageRepository.js'
import { validate, isString } from '../middleware/validate.js'

export const conversationRoutes = Router()

conversationRoutes.get('/', (_req, res) => {
  const conversations = getAllConversations()
  res.json(conversations)
})

conversationRoutes.get('/:id', (req, res) => {
  const conversation = getConversationById(req.params.id)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.json(conversation)
})

conversationRoutes.get('/:id/messages', (req, res) => {
  const conversation = getConversationById(req.params.id)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  const messages = getMessagesByConversationId(req.params.id)
  res.json(messages)
})

conversationRoutes.post('/', validate(
  isString('title', { maxLength: 500 }),
  isString('model_id', { maxLength: 100 }),
  isString('system_prompt', { maxLength: 10000 })
), (req, res) => {
  const conversation = createConversation(req.body)
  res.status(201).json(conversation)
})

conversationRoutes.put('/:id', validate(
  isString('title', { maxLength: 500 }),
  isString('model_id', { maxLength: 100 }),
  isString('system_prompt', { maxLength: 10000 })
), (req, res) => {
  const conversation = updateConversation(req.params.id, req.body)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.json(conversation)
})

conversationRoutes.delete('/:id', (req, res) => {
  const deleted = deleteConversation(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }
  res.status(204).send()
})
