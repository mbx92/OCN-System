// Server plugin: Scheduled database backup
// Runs based on backup-config.json settings

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')
const CONFIG_PATH = join(BACKUP_DIR, 'backup-config.json')

let backupTimer: ReturnType<typeof setInterval> | null = null

function getConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {}
  return { scheduledEnabled: false, scheduleInterval: 'daily', retentionDays: 7 }
}

function getIntervalMs(interval: string): number {
  switch (interval) {
    case '6hours':
      return 6 * 60 * 60 * 1000
    case '12hours':
      return 12 * 60 * 60 * 1000
    case 'daily':
      return 24 * 60 * 60 * 1000
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000
  }
}

async function cleanOldBackups(retentionDays: number) {
  try {
    const { readdir, stat, unlink } = await import('fs/promises')
    if (!existsSync(BACKUP_DIR)) return

    const files = await readdir(BACKUP_DIR)
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

    for (const file of files) {
      if (!file.endsWith('.sql') && !file.endsWith('.sql.gz')) continue
      const filepath = join(BACKUP_DIR, file)
      const fileStat = await stat(filepath)
      if (fileStat.mtime.getTime() < cutoff) {
        await unlink(filepath)
        console.log(`[Backup] Deleted old backup: ${file}`)
      }
    }
  } catch (err) {
    console.error('[Backup] Error cleaning old backups:', err)
  }
}

async function runScheduledBackup() {
  const config = getConfig()
  if (!config.scheduledEnabled) return

  try {
    // Dynamic import to avoid circular dependency
    const { createBackup } = await import('../api/utilities/backup/index.post')
    const result = await createBackup('scheduled')
    console.log(`[Backup] Scheduled backup created: ${result.filename} (${result.sizeFormatted})`)

    // Clean old backups
    await cleanOldBackups(config.retentionDays || 7)
  } catch (err) {
    console.error('[Backup] Scheduled backup failed:', err)
  }
}

export function restartBackupScheduler() {
  if (backupTimer) {
    clearInterval(backupTimer)
    backupTimer = null
  }

  const config = getConfig()
  if (!config.scheduledEnabled) {
    console.log('[Backup] Scheduled backup is disabled')
    return
  }

  const intervalMs = getIntervalMs(config.scheduleInterval)
  console.log(`[Backup] Scheduled backup enabled: every ${config.scheduleInterval}`)

  backupTimer = setInterval(runScheduledBackup, intervalMs)
}

export default defineNitroPlugin(() => {
  // Start scheduler after short delay to allow server to fully initialize
  setTimeout(() => {
    restartBackupScheduler()
  }, 10000)
})
