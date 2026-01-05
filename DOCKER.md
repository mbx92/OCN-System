# Docker Setup Guide

Panduan untuk menjalankan OCN-System menggunakan Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Setup Environment Variables

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit `.env` dan ubah nilai-nilai berikut:

- `JWT_SECRET` - Gunakan string random yang kuat
- `POSTGRES_PASSWORD` - Password database yang aman
- `BASE_URL` - URL aplikasi Anda

### 2. Build dan Jalankan Aplikasi

#### Production Mode

```bash
# Build dan jalankan semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Development Mode (Database Only)

Jika Anda ingin menjalankan database di Docker tapi aplikasi di local:

```bash
# Jalankan hanya database
docker-compose -f docker-compose.dev.yml up -d

# Set DATABASE_URL di .env Anda
# DATABASE_URL=postgresql://ocn_user:ocn_password@localhost:5432/ocn_db

# Jalankan aplikasi di local
npm run dev
```

### 3. Database Migration

Setelah aplikasi berjalan pertama kali:

```bash
# Migration akan otomatis dijalankan saat container start
# Tapi jika perlu manual:
docker-compose exec app npx prisma migrate deploy

# Seed database (opsional)
docker-compose exec app npm run db:seed
```

## Commands

### Manajemen Container

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Rebuild containers
docker-compose up -d --build
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U ocn_user -d ocn_db

# Backup database
docker-compose exec db pg_dump -U ocn_user ocn_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U ocn_user ocn_db

# View database logs
docker-compose logs -f db
```

### Application Operations

```bash
# Access app container shell
docker-compose exec app sh

# Run Prisma commands
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db push

# View app logs
docker-compose logs -f app
```

## Configuration

### Ports

Default ports yang digunakan:

- Application: `3000`
- PostgreSQL: `5432`

Ubah di file `.env` jika diperlukan:

```
APP_PORT=3000
POSTGRES_PORT=5432
```

### Environment Variables

| Variable            | Description          | Default               |
| ------------------- | -------------------- | --------------------- |
| `POSTGRES_USER`     | PostgreSQL username  | ocn_user              |
| `POSTGRES_PASSWORD` | PostgreSQL password  | ocn_password          |
| `POSTGRES_DB`       | Database name        | ocn_db                |
| `POSTGRES_PORT`     | PostgreSQL port      | 5432                  |
| `APP_PORT`          | Application port     | 3000                  |
| `JWT_SECRET`        | JWT secret key       | -                     |
| `JWT_EXPIRES_IN`    | JWT expiration time  | 7d                    |
| `BASE_URL`          | Application base URL | http://localhost:3000 |

### Volumes

Data persisten disimpan di Docker volumes:

- `postgres_data` - Data PostgreSQL

Untuk menghapus semua data:

```bash
docker-compose down -v
```

## Production Deployment

### 1. Security Checklist

- [ ] Ubah `JWT_SECRET` dengan nilai random yang kuat
- [ ] Gunakan password database yang kuat
- [ ] Update `BASE_URL` sesuai domain production
- [ ] Jangan expose port database ke public
- [ ] Setup firewall rules
- [ ] Enable SSL/TLS

### 2. Optimization

Edit `docker-compose.yml` untuk production:

```yaml
services:
  app:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
```

### 3. Monitoring

```bash
# Check container health
docker-compose ps

# Monitor resource usage
docker stats

# Check logs for errors
docker-compose logs --tail=100 app
```

## Troubleshooting

### Container tidak bisa start

```bash
# Check logs
docker-compose logs app

# Rebuild container
docker-compose up -d --build --force-recreate
```

### Database connection error

```bash
# Verify database is running
docker-compose ps db

# Check database health
docker-compose exec db pg_isready -U ocn_user

# Verify connection string
docker-compose exec app env | grep DATABASE_URL
```

### Port already in use

```bash
# Check what's using the port
netstat -ano | findstr :3000

# Change port in .env
APP_PORT=3001
```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Development Tips

### Hot Reload Development

Untuk development dengan hot reload, gunakan volume mount:

```yaml
# Add to docker-compose.dev.yml
services:
  app:
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

### Access Prisma Studio

```bash
# Forward port 5555
docker-compose exec app npx prisma studio
# Open http://localhost:5555
```

## Updates

### Update Dependencies

```bash
# Update packages
docker-compose exec app npm update

# Rebuild container
docker-compose up -d --build
```

### Update Database Schema

```bash
# Create migration
docker-compose exec app npx prisma migrate dev --name your_migration_name

# Apply migration
docker-compose exec app npx prisma migrate deploy
```
