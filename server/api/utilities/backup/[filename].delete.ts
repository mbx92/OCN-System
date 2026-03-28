// DELETE /api/utilities/backup/[filename]
// Delete a specific backup file

import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Filename required' })
  }

  // Sanitize filename - prevent path traversal
  const sanitized = basename(filename)
  if (
    sanitized !== filename ||
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  if (!sanitized.endsWith('.sql') && !sanitized.endsWith('.sql.gz')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type' })
  }

  const filepath = join(BACKUP_DIR, sanitized)

  if (!existsSync(filepath)) {
    throw createError({ statusCode: 404, statusMessage: 'Backup file not found' })
  }

  await unlink(filepath)

  return {
    success: true,
    message: `Backup ${sanitized} berhasil dihapus`,
  }
})
