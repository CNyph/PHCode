import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { queryAll, queryOne, run } from '../repositories/database.js'
import { validate, required, isString } from '../middleware/validate.js'

export const settingsRoutes = Router()

settingsRoutes.use(requireAuth)

function scopedKey(userId: string, key: string): string {
  return `${userId}:${key}`
}

settingsRoutes.get('/', (req, res) => {
  const prefix = `${req.authUser!.id}:`
  const settings = queryAll<{ key: string; value: string }>(
    'SELECT * FROM settings WHERE key LIKE ? ORDER BY updated_at DESC',
    [`${prefix}%`]
  ).map(setting => ({
    ...setting,
    key: setting.key.slice(prefix.length)
  }))
  res.json(settings)
})

settingsRoutes.get('/:key', (req, res) => {
  const setting = queryOne<{ key: string; value: string }>(
    'SELECT * FROM settings WHERE key = ?',
    [scopedKey(req.authUser!.id, req.params.key)]
  )
  if (!setting) {
    res.status(404).json({ error: 'Setting not found' })
    return
  }
  res.json({ ...setting, key: req.params.key })
})

settingsRoutes.put('/:key', validate(
  required('value'),
  isString('value', { maxLength: 10000 })
), (req, res) => {
  const { value } = req.body

  run(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    [scopedKey(req.authUser!.id, req.params.key), value, new Date().toISOString()]
  )

  res.json({ key: req.params.key, value })
})

settingsRoutes.delete('/:key', (req, res) => {
  const existing = queryOne(
    'SELECT * FROM settings WHERE key = ?',
    [scopedKey(req.authUser!.id, req.params.key)]
  )
  if (!existing) {
    res.status(404).json({ error: 'Setting not found' })
    return
  }

  run('DELETE FROM settings WHERE key = ?', [scopedKey(req.authUser!.id, req.params.key)])
  res.status(204).send()
})
