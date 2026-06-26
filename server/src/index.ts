import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initDatabase, flushDatabase } from './repositories/database.js'
import { conversationRoutes } from './routes/conversations.js'
import { messageRoutes } from './routes/messages.js'
import { chatRoutes } from './routes/chat.js'
import { settingsRoutes } from './routes/settings.js'
import { uploadRoutes } from './routes/upload.js'
import { knowledgeRoutes } from './routes/knowledge.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

async function start() {
  await initDatabase()

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/conversations', conversationRoutes)
  app.use('/api/messages', messageRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/knowledge', knowledgeRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  const server = app.listen(PORT, () => {
    console.log(`[Server] PHCode server running on http://localhost:${PORT}`)
  })

  const shutdown = () => {
    console.log('[Server] Shutting down...')
    server.close(() => {
      flushDatabase()
      console.log('[Server] Database saved. Goodbye.')
      process.exit(0)
    })
    setTimeout(() => {
      flushDatabase()
      process.exit(1)
    }, 5000)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start().catch(console.error)
