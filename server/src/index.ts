import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import path from 'path'
import { initDatabase, flushDatabase } from './repositories/database.js'
import { seedDefaultPrompts } from './repositories/promptRepository.js'
import { conversationRoutes } from './routes/conversations.js'
import { messageRoutes } from './routes/messages.js'
import { chatRoutes } from './routes/chat.js'
import { settingsRoutes } from './routes/settings.js'
import { uploadRoutes } from './routes/upload.js'
import { knowledgeRoutes } from './routes/knowledge.js'
import { promptRoutes } from './routes/prompts.js'
import { authRoutes } from './routes/auth.js'
import { searchRoutes } from './routes/search.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)

// Bypass system proxy for localhost connections
const localNoProxy = 'localhost,127.0.0.1,[::1]'
process.env.NO_PROXY = process.env.NO_PROXY ? `${process.env.NO_PROXY},${localNoProxy}` : localNoProxy
process.env.no_proxy = process.env.NO_PROXY

const app = express()
const PORT = Number(process.env.PORT || 3000)

let server: import('http').Server | null = null
let started = false

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || /^http:\/\/localhost:\d+$/.test(origin) || origin.startsWith('file://')) {
      callback(null, true)
      return
    }
    callback(new Error(`Origin not allowed: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Ollama-Base-Url']
}))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/prompts', promptRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

async function closeServer(exitCode?: number): Promise<void> {
  if (server) {
    const currentServer = server
    server = null
    await new Promise<void>(resolve => {
      currentServer.close(() => resolve())
    })
  }

  flushDatabase()

  if (exitCode !== undefined) {
    process.exit(exitCode)
  }
}

export async function startServer(): Promise<void> {
  if (started) return
  started = true

  await initDatabase()
  seedDefaultPrompts()

  server = app.listen(PORT, () => {
    console.log(`[Server] PHCode server running on http://localhost:${PORT}`)
  })

  const shutdown = (exitCode: number) => {
    console.log('[Server] Shutting down...')
    void closeServer(exitCode)
  }

  process.on('SIGTERM', () => shutdown(0))
  process.on('SIGINT', () => shutdown(0))
}

export async function stopServer(): Promise<void> {
  await closeServer()
}

function isEntrypoint(): boolean {
  const entrypoint = process.argv[1]
  if (!entrypoint) return false
  const normalizedEntrypoint = path.resolve(entrypoint)
  const normalizedCurrent = path.resolve(__filename)
  return normalizedEntrypoint === normalizedCurrent
}

if (isEntrypoint() && process.env.PHCODE_MANAGED_SERVER !== '1') {
  void startServer().catch(console.error)
}
