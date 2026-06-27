import { Router } from 'express'
import { validate, required, isString } from '../middleware/validate.js'
import {
  claimLegacyDataForUser,
  createAuthResponse,
  createUser,
  deleteSession,
  hasAnyUsers,
  getUserByUsername,
  verifyUserPassword,
} from '../repositories/authRepository.js'
import { requireAuth } from '../middleware/auth.js'

export const authRoutes = Router()

authRoutes.post('/register', validate(
  required('username'),
  required('password'),
  isString('username', { maxLength: 100 }),
  isString('password', { maxLength: 200 }),
  isString('display_name', { maxLength: 100 })
), (req, res) => {
  const username = String(req.body.username).trim()
  const password = String(req.body.password)
  const displayName = typeof req.body.display_name === 'string' ? req.body.display_name.trim() : ''

  if (username.length < 3) {
    res.status(400).json({ error: 'username must be at least 3 characters' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'password must be at least 6 characters' })
    return
  }
  if (getUserByUsername(username)) {
    res.status(409).json({ error: 'Username already exists' })
    return
  }

  const shouldClaimLegacyData = !hasAnyUsers()
  const user = createUser({
    username,
    password,
    displayName: displayName || username
  })

  if (shouldClaimLegacyData) {
    claimLegacyDataForUser(user.id)
  }

  res.status(201).json(createAuthResponse(user))
})

authRoutes.post('/login', validate(
  required('username'),
  required('password'),
  isString('username', { maxLength: 100 }),
  isString('password', { maxLength: 200 })
), (req, res) => {
  const username = String(req.body.username).trim()
  const password = String(req.body.password)
  const user = verifyUserPassword(username, password)
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' })
    return
  }
  res.json(createAuthResponse(user))
})

authRoutes.get('/me', requireAuth, (req, res) => {
  res.json(req.authUser)
})

authRoutes.post('/logout', requireAuth, (req, res) => {
  const token = (req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (token) {
    deleteSession(token)
  }
  res.json({ ok: true })
})
