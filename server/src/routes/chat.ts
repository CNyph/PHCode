import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { requireAuth } from '../middleware/auth.js'
import { getConversationById } from '../repositories/conversationRepository.js'
import { getMessagesByConversationId } from '../repositories/messageRepository.js'
import { getDocumentsByKnowledgeBaseId } from '../repositories/knowledgeRepository.js'
import { TIMEOUTS, DEFAULT_MODEL, LIMITS } from '../models/types.js'
import { buildWebSearchContext, searchWeb } from '../services/webSearch.js'

export const chatRoutes = Router()

chatRoutes.use(requireAuth)

type RequestLike = {
  header: (name: string) => string | undefined
  query: Record<string, unknown>
  body: Record<string, unknown>
}

function getOllamaBaseUrlFromRequest(req: RequestLike): string | undefined {
  const headerValue = req.header('x-ollama-base-url')?.trim()
  const queryValue = typeof req.query.ollama_base_url === 'string' ? req.query.ollama_base_url.trim() : ''
  const bodyValue = typeof req.body.ollama_base_url === 'string' ? req.body.ollama_base_url.trim() : ''
  const value = headerValue || queryValue || bodyValue
  return value || undefined
}

function getOllamaCandidates(req: RequestLike): string[] {
  const candidates: string[] = []
  const requestValue = getOllamaBaseUrlFromRequest(req)
  const envValue = process.env.OLLAMA_BASE_URL?.trim()

  for (const candidate of [
    requestValue,
    envValue,
    'http://127.0.0.1:11434',
    'http://localhost:11434'
  ]) {
    if (candidate && !candidates.includes(candidate)) {
      candidates.push(candidate)
    }
  }

  return candidates
}

async function probeServiceUrl(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

async function probeOllamaBaseUrl(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(`${baseUrl}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

async function discoverOllamaBaseUrl(req: RequestLike): Promise<string | null> {
  for (const candidate of getOllamaCandidates(req)) {
    if (await probeOllamaBaseUrl(candidate)) return candidate
  }
  return null
}

async function discoverAIServiceURL(): Promise<string> {
  if (process.env.AI_SERVICE_URL && await probeServiceUrl(process.env.AI_SERVICE_URL.trim())) {
    return process.env.AI_SERVICE_URL.trim()
  }

  const portFile = join(process.cwd(), '..', 'data', 'ai-port')
  try {
    if (existsSync(portFile)) {
      const port = readFileSync(portFile, 'utf-8').trim()
      const candidate = port && /^\d+$/.test(port) ? `http://localhost:${port}` : ''
      if (candidate && await probeServiceUrl(candidate)) return candidate
    }
  } catch {}

  for (const candidate of ['8000', '5000']) {
    const url = `http://localhost:${candidate}`
    if (await probeServiceUrl(url)) return url
  }

  return 'http://localhost:5000'
}

async function searchKnowledgeBase(knowledgeBaseId: string, query: string, userId?: string): Promise<string> {
  try {
    const documents = getDocumentsByKnowledgeBaseId(knowledgeBaseId, userId)
    if (documents.length === 0) return ''

    const docsForSearch = documents.map(d => ({
      document_id: d.id,
      filename: d.filename,
      content: d.content,
      embedding: d.embedding ? JSON.parse(d.embedding as string) : []
    }))

    const response = await fetch(`${await discoverAIServiceURL()}/v1/rag/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents: docsForSearch, top_k: 3 })
    })

    if (!response.ok) return ''
    const result = await response.json()
    return result.context || ''
  } catch {
    return ''
  }
}

async function fetchOllamaModels(baseUrl: string): Promise<Array<{ name?: string }>> {
  const response = await fetch(`${baseUrl}/api/tags`)
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data.models) ? data.models : []
}

async function streamDirectOllamaChat(
  baseUrl: string,
  model: string,
  messages: { role: string; content: string }[],
  signal: AbortSignal,
  res: { write: (chunk: string) => void }
) {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true
    }),
    signal
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.error || `Ollama error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

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
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed)
        const content = parsed.message?.content || ''
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
        if (parsed.done) {
          res.write('data: [DONE]\n\n')
          return
        }
      } catch {
        continue
      }
    }
  }
}

chatRoutes.post('/stream', async (req, res) => {
  const { conversation_id, content, model_id, knowledge_base_id, web_search } = req.body

  if (!conversation_id || !content) {
    res.status(400).json({ error: 'conversation_id and content are required' })
    return
  }

  if (typeof content !== 'string' || content.length > 100000) {
    res.status(400).json({ error: 'content must be a string under 100000 characters' })
    return
  }

  const conversation = getConversationById(conversation_id, req.authUser!.id)
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const allMessages = getMessagesByConversationId(conversation_id, undefined, req.authUser!.id)
  const history = allMessages.slice(-LIMITS.MAX_HISTORY_MESSAGES)
  const messages: { role: string; content: string }[] = history.map(m => ({ role: m.role, content: m.content }))

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== content) {
    messages.push({ role: 'user', content })
  }

  if (knowledge_base_id) {
    const ragContext = await searchKnowledgeBase(knowledge_base_id, content, req.authUser!.id)
    if (ragContext) {
      messages.unshift({
        role: 'system',
        content: `你是一个有帮助的 AI 助手。以下是与用户问题相关的参考资料，请基于这些资料回答问题：\n\n${ragContext}\n\n如果资料中没有相关信息，请明确说明。`
      })
    }
  }

  if (web_search) {
    try {
      const results = await searchWeb(content, 5)
      const webContext = buildWebSearchContext(results)
      if (webContext) {
        messages.unshift({
          role: 'system',
          content: webContext
        })
      }
    } catch (error) {
      console.warn('[Chat] Web search unavailable, continuing without it:', error)
    }
  }

  try {
    const ollamaBaseUrl = await discoverOllamaBaseUrl(req)
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

    if (!ollamaBaseUrl) {
      res.write(`data: ${JSON.stringify({ error: '未探测到可用的 Ollama 服务' })}\n\n`)
      clearTimeout(aiTimeout)
      return
    }

    await streamDirectOllamaChat(
      ollamaBaseUrl,
      model_id || conversation.model_id || DEFAULT_MODEL,
      messages,
      controller.signal,
      res
    )

    clearTimeout(aiTimeout)
    res.end()
  } catch (error: unknown) {
    console.error('[Chat] Stream error:', error)
    const err = error as { name?: string }
    const message = err.name === 'AbortError'
      ? 'AI 服务响应超时'
      : '无法连接到 Ollama 服务'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
})

chatRoutes.get('/models', async (req, res) => {
  try {
    const ollamaBaseUrl = await discoverOllamaBaseUrl(req)
    if (!ollamaBaseUrl) {
      res.status(503).json({ error: '未探测到可用的 Ollama 服务', data: [], resolved_ollama_url: null })
      return
    }

    const models = await fetchOllamaModels(ollamaBaseUrl)
    const data = models.map(m => ({
      id: m.name || 'unknown',
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'ollama'
    }))

    res.json({ object: 'list', data, resolved_ollama_url: ollamaBaseUrl })
  } catch (error: unknown) {
    console.error('[Chat] Failed to fetch models:', error)
    const err = error as { name?: string; message?: string }
    console.error('[Chat] Error name:', err.name, 'message:', err.message)
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Ollama 服务响应超时，请稍后重试', data: [], resolved_ollama_url: null })
    } else {
      res.status(502).json({ error: '无法连接到 Ollama 服务，请确认 Ollama 已启动', data: [], resolved_ollama_url: null })
    }
  }
})
