import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  getBranches,
  getMessagesByBranch
} from '../repositories/messageRepository.js'
import { validate, required, isString, isOneOf } from '../middleware/validate.js'
import { run } from '../repositories/database.js'

export const messageRoutes = Router()

messageRoutes.use(requireAuth)

messageRoutes.get('/branches/:conversationId', (req, res) => {
  const branches = getBranches(req.params.conversationId, req.authUser!.id)
  res.json(branches)
})

messageRoutes.get('/branch/:conversationId/:branchId', (req, res) => {
  const messages = getMessagesByBranch(req.params.conversationId, req.params.branchId, req.authUser!.id)
  res.json(messages)
})

messageRoutes.get('/:id', (req, res) => {
  const message = getMessageById(req.params.id, req.authUser!.id)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  res.json(message)
})

messageRoutes.post('/', validate(
  required('conversation_id'),
  isOneOf('role', ['user', 'assistant', 'system']),
  required('content'),
  isString('content', { maxLength: 100000 })
), (req, res) => {
  const { conversation_id, ...data } = req.body
  const message = createMessage(conversation_id, data, req.authUser!.id)
  res.status(201).json(message)
})

messageRoutes.put('/:id', validate(
  required('content'),
  isString('content', { maxLength: 100000 })
), (req, res) => {
  const { content } = req.body
  const message = updateMessage(req.params.id, content, req.authUser!.id)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  res.json(message)
})

messageRoutes.put('/:id/feedback', (req, res) => {
  const { feedback } = req.body
  if (feedback !== undefined && feedback !== null && feedback !== 'positive' && feedback !== 'negative') {
    res.status(400).json({ error: 'feedback must be positive, negative, or null' })
    return
  }

  const message = getMessageById(req.params.id, req.authUser!.id)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  run(
    'UPDATE messages SET feedback = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
    [feedback ?? null, req.params.id, req.authUser!.id]
  )
  res.json({ id: req.params.id, feedback: feedback ?? null })
})

messageRoutes.delete('/:id', (req, res) => {
  const deleted = deleteMessage(req.params.id, req.authUser!.id)
  if (!deleted) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  res.status(204).send()
})
