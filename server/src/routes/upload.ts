import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'data', 'uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/javascript',
      'application/typescript',
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/css',
      'text/html'
    ]

    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

export const uploadRoutes = Router()

uploadRoutes.post('/', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: '没有上传文件' })
    return
  }

  const uploadedFiles = files.map(file => ({
    id: path.basename(file.filename, path.extname(file.filename)),
    filename: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    url: `/uploads/${file.filename}`
  }))

  res.json({ files: uploadedFiles })
})

uploadRoutes.get('/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename)
  const filePath = path.resolve(UPLOADS_DIR, safeName)
  if (!filePath.startsWith(path.resolve(UPLOADS_DIR))) {
    res.status(403).json({ error: '禁止访问' })
    return
  }
  res.setHeader('Content-Disposition', 'attachment')
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: '文件不存在' })
    }
  })
})
