import { Router } from 'express'
import { getConversationById } from '../repositories/conversationRepository.js'
import { getMessagesByConversationId } from '../repositories/messageRepository.js'
import { TIMEOUTS, DEFAULT_MODEL, LIMITS } from '../models/types.js'

export const chatRoutes = Router()

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

chatRoutes.post('/stream', async (req, res) => {
  const { conversation_id, content, model_id } = req.body

  if (!conversation_id || !content) {
    res.status(400).json({ error: 'conversation_id and content are required' })
    return
  }

  if (typeof content !== 'string' || content.length > 100000) {
    res.status(400).json({ error: 'content must be a string under 100000 characters' })
    return
  }

  const conversation = getConversationById(conversation_id)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const allMessages = getMessagesByConversationId(conversation_id)
  const history = allMessages.slice(-LIMITS.MAX_HISTORY_MESSAGES)
  const messages = history.map(m => ({ role: m.role, content: m.content }))

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let clientDisconnected = false
  const controller = new AbortController()
  const aiTimeout = setTimeout(() => controller.abort(), TIMEOUTS.AI_SERVICE)

  req.on('close', () => {
    clientDisconnected = true
    controller.abort()
  })

  try {
    const response = await fetch(`${AI_SERVICE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model_id || conversation.model_id || DEFAULT_MODEL,
        messages,
        stream: true
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n')
          continue
        }

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`)
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    clearTimeout(aiTimeout)
  } catch (error: unknown) {
    clearTimeout(aiTimeout)
    if (clientDisconnected) return
    console.error('[Chat] Stream error:', error)
    const err = error as { name?: string }
    const message = err.name === 'AbortError'
      ? 'AI 服务响应超时'
      : 'Failed to get response from AI service'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
  } finally {
    clearTimeout(aiTimeout)
    res.end()
  }
})

chatRoutes.get('/models', async (_req, res) => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUTS.MODEL_LIST)

    const response = await fetch(`${AI_SERVICE_URL}/v1/models`, {
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.error || `AI service error: ${response.status}`
      res.status(response.status).json({ error: message })
      return
    }

    const data = await response.json()
    res.json(data)
  } catch (error: unknown) {
    console.error('[Chat] Failed to fetch models:', error)
    const err = error as { name?: string }
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'AI 服务响应超时，请稍后重试' })
    } else {
      res.status(502).json({ error: '无法连接到 AI 服务，请确认后端服务已启动' })
    }
  }
})
