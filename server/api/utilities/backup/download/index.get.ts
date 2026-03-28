// GET /api/utilities/backup/download
// Download backup file via query param: ?file=filename.sql

import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import { join, basename } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const query = getQuery(event)
  const filename = query.file as string
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Query param "file" required' })
  }

  // Sanitize filename - prevent path traversal
  const sanitized = basename(decodeURIComponent(filename))
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  // Only allow .sql and .sql.gz files
  if (!sanitized.endsWith('.sql') && !sanitized.endsWith('.sql.gz')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type' })
  }

  const filepath = join(BACKUP_DIR, sanitized)

  if (!existsSync(filepath)) {
    throw createError({ statusCode: 404, statusMessage: 'Backup file not found' })
  }

  const fileStat = await stat(filepath)

  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(event, 'Content-Disposition', `attachment; filename="${sanitized}"`)
  setHeader(event, 'Content-Length', String(fileStat.size))

  return sendStream(event, createReadStream(filepath))
})
