import type { NextFunction, Request, Response } from 'express'
import type { AuthUser } from '../models/types.js'
import { getSessionUser } from '../repositories/authRepository.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

function getBearerToken(req: Request): string | undefined {
  const header = req.header('authorization') || req.header('Authorization')
  if (!header) return undefined
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() || undefined
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = getBearerToken(req)
  if (token) {
    req.authUser = getSessionUser(token)
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const user = getSessionUser(token)
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  req.authUser = user
  next()
}

