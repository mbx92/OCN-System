#!/bin/bash

# Script Deploy Automatis untuk OCN System

# Hentikan script jika ada error
set -e

echo "🚀 Memulai proses deployment OCN System..."

# 1. Pull perubahan terbaru dari git
echo "📥 Mengambil perubahan terbaru dari git..."
git pull

# 2. Build ulang image dan restart container
# Menggunakan docker-compose.prod.yml karena ini untuk server
echo "🐳 Build ulang dan restart containers..."
docker compose -f docker-compose.prod.yml up -d --build

# 3. Bersihkan image lama yang tidak terpakai untuk menghemat space
echo "🧹 Membersihkan image lama..."
docker image prune -f

echo "✅ Deployment selesai! Aplikasi sudah berjalan dengan versi terbaru."
