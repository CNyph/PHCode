import { Request, Response, NextFunction } from 'express'

type Validator = (body: Record<string, unknown>) => string | null

export function validate(...validators: Validator[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const validator of validators) {
      const error = validator(req.body as Record<string, unknown>)
      if (error) {
        res.status(400).json({ error })
        return
      }
    }
    next()
  }
}

export function required(field: string): Validator {
  return (body) => {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field} is required`
    }
    return null
  }
}

export function isString(field: string, options?: { maxLength?: number }): Validator {
  return (body) => {
    if (body[field] !== undefined && typeof body[field] !== 'string') {
      return `${field} must be a string`
    }
    if (options?.maxLength && typeof body[field] === 'string' && body[field].length > options.maxLength) {
      return `${field} must be under ${options.maxLength} characters`
    }
    return null
  }
}

export function isOneOf(field: string, values: readonly string[]): Validator {
  return (body) => {
    if (body[field] !== undefined && !values.includes(body[field] as string)) {
      return `${field} must be one of: ${values.join(', ')}`
    }
    return null
  }
}
