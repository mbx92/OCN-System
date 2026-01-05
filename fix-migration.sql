-- Fix failed migration: 20260105132841_add_stock_opname
-- Run this SQL directly in production database

BEGIN;

-- 1. Check if StockOpname table already exists, if not create it
CREATE TABLE IF NOT EXISTS "StockOpname" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "systemStock" INTEGER NOT NULL DEFAULT 0,
    "actualStock" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("id")
);

-- 2. Check if MaintenanceSchedule table already exists, if not create it
CREATE TABLE IF NOT EXISTS "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "customerId" TEXT,
    "resultProjectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "MaintenanceScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- 3. Add foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StockOpname_productId_fkey'
    ) THEN
        ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceSchedule_projectId_fkey'
    ) THEN
        ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_projectId_fkey" 
        FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceSchedule_customerId_fkey'
    ) THEN
        ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceSchedule_resultProjectId_fkey'
    ) THEN
        ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_resultProjectId_fkey" 
        FOREIGN KEY ("resultProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MaintenanceSchedule_createdBy_fkey'
    ) THEN
        ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_createdBy_fkey" 
        FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Mark migration as applied
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'e8c5c8f5a8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5c8d5f8a5',
    NOW(),
    '20260105132841_add_stock_opname',
    NULL,
    NULL,
    NOW(),
    1
)
ON CONFLICT (migration_name) DO NOTHING;

COMMIT;
