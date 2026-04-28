// POST /api/utilities/backup
// Create database backup manually or update schedule config

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)
const BACKUP_DIR = join(process.cwd(), 'backups')

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody(event)
  const action = body?.action as string

  if (action === 'update-schedule') {
    return await updateScheduleConfig(body)
  }

  // Default: create manual backup
  return await createBackup('manual')
})

export async function createBackup(type: 'manual' | 'scheduled' = 'manual') {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL not configured' })
  }

  // Parse DATABASE_URL
  const parsed = parseDatabaseUrl(databaseUrl)
  if (!parsed) {
    throw createError({ statusCode: 500, statusMessage: 'Invalid DATABASE_URL format' })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
  const filename = `ocn_backup_${type}_${timestamp}.sql`
  const filepath = join(BACKUP_DIR, filename)

  try {
    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: parsed.password }

    const command = `pg_dump -h ${parsed.host} -p ${parsed.port} -U ${parsed.user} -d ${parsed.database} -F p --no-owner --no-privileges -f "${filepath}"`

    await execAsync(command, { env, timeout: 120000 })

    // Get file size
    const { stat } = await import('fs/promises')
    const fileStat = await stat(filepath)

    return {
      success: true,
      message: `Backup ${type} berhasil dibuat`,
      filename,
      size: fileStat.size,
      sizeFormatted: formatFileSize(fileStat.size),
      createdAt: new Date().toISOString(),
      type,
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage:
        `Backup gagal: ${err.message}. ` +
        'Pastikan pg_dump tersedia di server/container aplikasi agar backup mencakup seluruh tabel dan struktur database.',
    })
  }
}

async function updateScheduleConfig(body: any) {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const config = {
    scheduledEnabled: body.scheduledEnabled ?? false,
    scheduleInterval: body.scheduleInterval ?? 'daily',
    retentionDays: body.retentionDays ?? 7,
    updatedAt: new Date().toISOString(),
  }

  const configPath = join(BACKUP_DIR, 'backup-config.json')
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')

  return {
    success: true,
    message: 'Konfigurasi backup berhasil disimpan',
    ...config,
  }
}

function parseDatabaseUrl(url: string) {
  try {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
    if (!match) return null
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    }
  } catch {
    return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
