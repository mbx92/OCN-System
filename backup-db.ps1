# Database Backup Script for Production (PowerShell)
# Usage: .\backup-db.ps1

$ErrorActionPreference = "Stop"

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = ".\backups"
$CONTAINER_NAME = "ocn-system"

# Buat folder backup jika belum ada
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "📦 Creating database backup..." -ForegroundColor Cyan

# Ambil DATABASE_URL dari container
$DB_URL = docker exec $CONTAINER_NAME printenv DATABASE_URL

# Parse DATABASE_URL (simplified - adjust if needed)
$BACKUP_FILE = "$BACKUP_DIR\ocn_backup_$TIMESTAMP.sql"

Write-Host "💾 Backing up to: $BACKUP_FILE" -ForegroundColor Gray

# Backup database
docker exec $CONTAINER_NAME sh -c "pg_dump `$DATABASE_URL -F c -b -v" > $BACKUP_FILE

# Compress
Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
Remove-Item $BACKUP_FILE

Write-Host "✅ Backup created: $BACKUP_FILE.zip" -ForegroundColor Green
Write-Host "📊 Backup size: $((Get-Item "$BACKUP_FILE.zip").Length / 1MB) MB" -ForegroundColor Gray

# Hapus backup yang lebih dari 7 hari
Get-ChildItem $BACKUP_DIR -Filter "*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item -Force

Write-Host "🧹 Old backups cleaned (>7 days)" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Backup complete!" -ForegroundColor Green
