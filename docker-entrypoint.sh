#!/bin/sh

# OCN System Docker Entrypoint
# This script runs migrations ONLY (no seed in production)

set -e

echo "🚀 Starting OCN System..."

# Fix failed migration if exists
echo "🔧 Checking for failed migrations..."
npx prisma migrate resolve --rolled-back "20260105132841_add_stock_opname" || true

# Run database migrations (safe, only adds new tables/columns)
echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete!"

# Start the application
echo "🌐 Starting web server..."
exec node .output/server/index.mjs
