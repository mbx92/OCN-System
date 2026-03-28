// GET /api/utilities/backup/download/[filename]
// Download a specific backup file

import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import { join, basename } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Support both route param and query param
  let filename = getRouterParam(event, 'filename') || (getQuery(event).file as string)
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Filename required' })
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
  setHeader(event, 'Content-Length', fileStat.size)

  return sendStream(event, createReadStream(filepath))
})
