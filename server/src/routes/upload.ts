import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

async function extractTextContent(filePath: string, mimetype: string): Promise<string | null> {
  const ext = path.extname(filePath).toLowerCase()

  if (mimetype === 'application/pdf') {
    try {
      const { PDFParse } = await import('pdf-parse')
      const buffer = fs.readFileSync(filePath)
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      return result.text
    } catch {
      return null
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = await import('mammoth')
      const buffer = fs.readFileSync(filePath)
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch {
      return null
    }
  }

  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const text = fs.readFileSync(filePath, 'utf-8')
      return text
    } catch {
      return null
    }
  }

  if (mimetype.startsWith('text/') || ext === '.json' || ext === '.md' || ext === '.csv') {
    try {
      return fs.readFileSync(filePath, 'utf-8')
    } catch {
      return null
    }
  }

  return null
}

export const uploadRoutes = Router()

uploadRoutes.use(requireAuth)

uploadRoutes.post('/', upload.array('files', 10), async (req, res) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: '没有上传文件' })
    return
  }

  const uploadedFiles = await Promise.all(files.map(async (file) => {
    const textContent = await extractTextContent(file.path, file.mimetype)
    return {
      id: path.basename(file.filename, path.extname(file.filename)),
      filename: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`,
      textContent
    }
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
