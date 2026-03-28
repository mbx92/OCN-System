// GET /api/utilities/backup
// List available database backups

import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const BACKUP_DIR = join(process.cwd(), 'backups')

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  try {
    if (!existsSync(BACKUP_DIR)) {
      return { backups: [], scheduledEnabled: false, scheduleInterval: 'daily' }
    }

    const files = await readdir(BACKUP_DIR)
    const backupFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'))

    const backups = await Promise.all(
      backupFiles.map(async filename => {
        const filepath = join(BACKUP_DIR, filename)
        const fileStat = await stat(filepath)
        return {
          filename,
          size: fileStat.size,
          sizeFormatted: formatFileSize(fileStat.size),
          createdAt: fileStat.mtime.toISOString(),
          type: filename.includes('scheduled') ? 'scheduled' : 'manual',
        }
      })
    )

    // Sort by date desc
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Read schedule config
    const configPath = join(BACKUP_DIR, 'backup-config.json')
    let scheduledEnabled = false
    let scheduleInterval = 'daily'
    let retentionDays = 7

    if (existsSync(configPath)) {
      try {
        const { readFile } = await import('fs/promises')
        const raw = await readFile(configPath, 'utf-8')
        const config = JSON.parse(raw)
        scheduledEnabled = config.scheduledEnabled ?? false
        scheduleInterval = config.scheduleInterval ?? 'daily'
        retentionDays = config.retentionDays ?? 7
      } catch {}
    }

    return {
      backups,
      scheduledEnabled,
      scheduleInterval,
      retentionDays,
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to list backups' })
  }
})

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
