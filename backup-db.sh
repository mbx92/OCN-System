#!/bin/bash

# Database Backup Script for Production
# Usage: ./backup-db.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
CONTAINER_NAME="ocn-system"

# Buat folder backup jika belum ada
mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."

# Ambil DATABASE_URL dari container
DB_URL=$(docker exec $CONTAINER_NAME printenv DATABASE_URL)

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

BACKUP_FILE="$BACKUP_DIR/ocn_backup_$TIMESTAMP.sql"

# Backup menggunakan pg_dump
docker exec -e PGPASSWORD=$DB_PASS $CONTAINER_NAME pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -b \
  -v \
  -f "/tmp/backup_$TIMESTAMP.sql"

# Copy backup dari container ke host
docker cp $CONTAINER_NAME:/tmp/backup_$TIMESTAMP.sql $BACKUP_FILE

# Hapus dari container
docker exec $CONTAINER_NAME rm /tmp/backup_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: ${BACKUP_FILE}.gz"
echo "📊 Backup size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

# Hapus backup yang lebih dari 7 hari
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "🧹 Old backups cleaned (>7 days)"

echo ""
echo "📝 To restore this backup:"
echo "   gunzip ${BACKUP_FILE}.gz"
echo "   docker exec -i $CONTAINER_NAME pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
