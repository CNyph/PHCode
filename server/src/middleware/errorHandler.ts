import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

const isDev = process.env.NODE_ENV !== 'production'

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message)
  if (isDev && err.stack) {
    console.error(err.stack)
  }

  const statusCode = err.statusCode || 500
  const message = isDev ? (err.message || '服务器内部错误') : '服务器内部错误'

  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      statusCode
    }
  })
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: '接口不存在',
      code: 'NOT_FOUND',
      statusCode: 404
    }
  })
}
