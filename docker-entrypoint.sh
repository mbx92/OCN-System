#!/bin/sh

# OCN System Docker Entrypoint
set -e

echo "🚀 Starting OCN System..."

# Run database migrations (safe, only adds new tables/columns)
echo "📊 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete!"

# Start the application
echo "🌐 Starting web server..."
exec node .output/server/index.mjs
