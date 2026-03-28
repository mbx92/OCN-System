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

    const command = `pg_dump -h ${parsed.host} -p ${parsed.port} -U ${parsed.user} -d ${parsed.database} -F p -f "${filepath}"`

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
    // If pg_dump fails, try alternative method via Prisma raw query
    try {
      return await createBackupViaPrisma(filepath, filename, type)
    } catch (prismaErr: any) {
      throw createError({
        statusCode: 500,
        statusMessage: `Backup gagal: ${err.message}. pg_dump mungkin tidak terinstall.`,
      })
    }
  }
}

async function createBackupViaPrisma(filepath: string, filename: string, type: string) {
  // Fallback: export schema + data as SQL via Prisma
  const { writeFile } = await import('fs/promises')

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `

  let sql = `-- OCN System Database Backup\n-- Created: ${new Date().toISOString()}\n-- Type: ${type}\n\n`

  for (const { tablename } of tables) {
    if (tablename.startsWith('_')) continue

    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tablename}"`)
      if (Array.isArray(rows) && rows.length > 0) {
        sql += `-- Table: ${tablename} (${rows.length} rows)\n`

        for (const row of rows) {
          const columns = Object.keys(row as Record<string, unknown>)
          const values = columns.map(col => {
            const val = (row as Record<string, unknown>)[col]
            if (val === null) return 'NULL'
            if (typeof val === 'number') return String(val)
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
            if (val instanceof Date) return `'${val.toISOString()}'`
            return `'${String(val).replace(/'/g, "''")}'`
          })
          sql += `INSERT INTO "${tablename}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`
        }
        sql += '\n'
      }
    } catch {}
  }

  await writeFile(filepath, sql, 'utf-8')

  const { stat } = await import('fs/promises')
  const fileStat = await stat(filepath)

  return {
    success: true,
    message: `Backup ${type} berhasil dibuat (via Prisma fallback)`,
    filename,
    size: fileStat.size,
    sizeFormatted: formatFileSize(fileStat.size),
    createdAt: new Date().toISOString(),
    type,
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
