import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { searchWeb } from '../services/webSearch.js'

export const searchRoutes = Router()

searchRoutes.use(requireAuth)

searchRoutes.post('/web', async (req, res) => {
  const query = typeof req.body.query === 'string' ? req.body.query.trim() : ''
  const topK = typeof req.body.top_k === 'number' ? req.body.top_k : 5

  if (!query) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  try {
    const results = await searchWeb(query, Math.min(Math.max(topK, 1), 10))
    res.json({ results })
  } catch (error) {
    console.error('[Search] Web search failed:', error)
    res.status(502).json({ error: 'Unable to search web' })
  }
})

