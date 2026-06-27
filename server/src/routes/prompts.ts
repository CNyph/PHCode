import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getAllPrompts,
  getPromptsByCategory,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt
} from '../repositories/promptRepository.js'

export const promptRoutes = Router()

promptRoutes.use(requireAuth)

promptRoutes.get('/', (req, res) => {
  const category = req.query.category as string | undefined
  const prompts = category ? getPromptsByCategory(category, req.authUser!.id) : getAllPrompts(req.authUser!.id)
  res.json(prompts)
})

promptRoutes.get('/:id', (req, res) => {
  const prompt = getPromptById(req.params.id, req.authUser!.id)
  if (!prompt) {
    res.status(404).json({ error: 'Prompt not found' })
    return
  }
  res.json(prompt)
})

promptRoutes.post('/', (req, res) => {
  const { name, content, category } = req.body
  if (!name || !content || !category) {
    res.status(400).json({ error: 'name, content, and category are required' })
    return
  }
  const prompt = createPrompt({ name, content, category }, req.authUser!.id)
  res.status(201).json(prompt)
})

promptRoutes.put('/:id', (req, res) => {
  const prompt = updatePrompt(req.params.id, req.body, req.authUser!.id)
  if (!prompt) {
    res.status(404).json({ error: 'Prompt not found' })
    return
  }
  res.json(prompt)
})

promptRoutes.delete('/:id', (req, res) => {
  const deleted = deletePrompt(req.params.id, req.authUser!.id)
  if (!deleted) {
    res.status(404).json({ error: 'Prompt not found or is system prompt' })
    return
  }
  res.status(204).send()
})
