# Fix Migration Error di Production

## Problem

Migration `20260105132841_add_stock_opname` gagal karena enum `MaintenanceScheduleStatus` sudah ada di database.

## Solution - Pilih salah satu:

### Option 1: Mark Migration as Resolved (RECOMMENDED)

```bash
# 1. SSH ke server production
ssh user@server

# 2. Masuk ke database
psql -U adminpg -h 10.100.10.5 -d ocn_db

# 3. Jalankan SQL fix
\i fix-migration.sql

# Atau copy-paste SQL dari fix-migration.sql
```

### Option 2: Manual SQL Fix

```sql
-- Connect ke database production
psql -U adminpg -h 10.100.10.5 -d ocn_db

-- 1. Delete failed migration record
DELETE FROM "_prisma_migrations"
WHERE migration_name = '20260105132841_add_stock_opname';

-- 2. Create tables if not exist (sudah ada di fix-migration.sql)

-- 3. Mark as applied
INSERT INTO "_prisma_migrations" (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
)
VALUES (
    gen_random_uuid()::text,
    'e8c5c8f5a8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5',
    NOW(),
    '20260105132841_add_stock_opname',
    NULL,
    NULL,
    NOW(),
    1
);
```

### Option 3: Reset Migration (DANGER - Data Loss)

⚠️ **JANGAN gunakan di production kecuali data tidak penting!**

```bash
npx prisma migrate reset --force
```

## After Fix

Setelah migration resolved:

```bash
# 1. Restart Docker container
docker-compose down
docker-compose up -d

# 2. Check logs
docker-compose logs -f

# 3. Verify migration status
docker exec -it ocn-system npx prisma migrate status
```

## Prevention for Future

Migration file sudah di-update dengan safe CREATE TYPE:

- Menggunakan `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`
- Tidak akan error jika enum sudah ada

## Quick Commands

```bash
# Check migration status
docker exec -it ocn-system npx prisma migrate status

# Check database tables
psql -U adminpg -h 10.100.10.5 -d ocn_db -c "\dt"

# Check enum types
psql -U adminpg -h 10.100.10.5 -d ocn_db -c "\dT+ MaintenanceScheduleStatus"
```
