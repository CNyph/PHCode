import { Router } from 'express'
import { queryAll, queryOne, run } from '../repositories/database.js'
import { validate, required, isString } from '../middleware/validate.js'

export const settingsRoutes = Router()

settingsRoutes.get('/', (_req, res) => {
  const settings = queryAll<{ key: string; value: string }>('SELECT * FROM settings')
  res.json(settings)
})

settingsRoutes.get('/:key', (req, res) => {
  const setting = queryOne<{ key: string; value: string }>('SELECT * FROM settings WHERE key = ?', [req.params.key])
  if (!setting) {
    res.status(404).json({ error: 'Setting not found' })
    return
  }
  res.json(setting)
})

settingsRoutes.put('/:key', validate(
  required('value'),
  isString('value', { maxLength: 10000 })
), (req, res) => {
  const { value } = req.body

  run(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    [req.params.key, value, new Date().toISOString()]
  )

  res.json({ key: req.params.key, value })
})

settingsRoutes.delete('/:key', (req, res) => {
  const existing = queryOne('SELECT * FROM settings WHERE key = ?', [req.params.key])
  if (!existing) {
    res.status(404).json({ error: 'Setting not found' })
    return
  }

  run('DELETE FROM settings WHERE key = ?', [req.params.key])
  res.status(204).send()
})
