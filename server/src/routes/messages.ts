import { Router } from 'express'
import {
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage
} from '../repositories/messageRepository.js'
import { validate, required, isString, isOneOf } from '../middleware/validate.js'
import { run } from '../repositories/database.js'

export const messageRoutes = Router()

messageRoutes.get('/:id', (req, res) => {
  const message = getMessageById(req.params.id)
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
  const message = createMessage(conversation_id, data)
  res.status(201).json(message)
})

messageRoutes.put('/:id', validate(
  required('content'),
  isString('content', { maxLength: 100000 })
), (req, res) => {
  const { content } = req.body
  const message = updateMessage(req.params.id, content)
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

  const message = getMessageById(req.params.id)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  run(
    'UPDATE messages SET feedback = ? WHERE id = ?',
    [feedback ?? null, req.params.id]
  )
  res.json({ id: req.params.id, feedback: feedback ?? null })
})

messageRoutes.delete('/:id', (req, res) => {
  const deleted = deleteMessage(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  res.status(204).send()
})
