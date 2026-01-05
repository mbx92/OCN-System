# Production Update & Deployment Guide

## ⚠️ PENTING: Data Safety di Production

### **Seed vs Migration**

- **Migration** (`prisma migrate deploy`) ✅ AMAN untuk production
  - Hanya menambah/update struktur database (tabel, kolom)
  - **TIDAK menghapus data**
  - Wajib dijalankan saat update schema

- **Seed** (`npm run db:seed`) ❌ JANGAN di production
  - Menghapus SEMUA data lalu insert data sample
  - Hanya untuk development/testing
  - Akan menghilangkan semua data real!

---

## 📋 Workflow Update Production yang Aman

### **1. Backup Database (WAJIB!)**

Sebelum update apapun, SELALU backup dulu:

```bash
# Jalankan script backup
./backup-db.sh

# Atau manual
docker exec ocn-system pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### **2. Update Docker Image**

```bash
# Pull image terbaru
docker-compose pull

# Atau manual
docker pull mbx92/ocn-system:latest
```

### **3. Jalankan Migration (Bukan Seed!)**

```bash
# Stop container
docker-compose down

# Start lagi (migration auto-run jika pakai entrypoint)
docker-compose up -d

# Atau manual migration:
docker exec ocn-system npx prisma migrate deploy
```

### **4. Verifikasi**

```bash
# Cek logs
docker-compose logs -f

# Cek aplikasi
curl https://erp.ocnetworks.web.id

# Cek data masih ada
docker exec ocn-system npx prisma studio
```

---

## 🔄 Update Routine (Checklist)

- [ ] **Backup database**
- [ ] Pull latest image
- [ ] Stop containers
- [ ] Run migrations (NOT seed!)
- [ ] Start containers
- [ ] Check logs for errors
- [ ] Verify application works
- [ ] Verify data intact

---

## 🚨 Emergency: Data Hilang?

Jika data hilang karena seed:

```bash
# Restore dari backup
gunzip backups/ocn_backup_YYYYMMDD_HHMMSS.sql.gz

docker exec -i ocn-system psql $DATABASE_URL < backups/ocn_backup_YYYYMMDD_HHMMSS.sql
```

---

## 📝 Best Practices

1. **Selalu backup sebelum update**
2. **Jangan pernah run seed di production**
3. **Test update di staging/local dulu**
4. **Simpan backup minimal 7-30 hari**
5. **Monitor logs setelah update**
6. **Punya rollback plan**

---

## 🛠️ Development vs Production

### Development (Local)

```bash
npm run db:seed          # ✅ OK - reset data untuk testing
npx prisma migrate dev   # ✅ OK - buat migration baru
```

### Production

```bash
npm run db:seed          # ❌ JANGAN! Data akan hilang
npx prisma migrate deploy # ✅ OK - hanya update schema
```

---

## 📞 Troubleshooting

**Q: Data saya hilang setelah update!**
A: Restore dari backup. Jangan run seed di production.

**Q: Migration gagal?**
A: Cek logs, mungkin ada schema conflict. Bisa pakai `npx prisma db push` (⚠️ force).

**Q: Aplikasi error setelah update?**
A: Rollback ke image sebelumnya, restore backup, debug di local.

**Q: Bagaimana rollback?**
A:

```bash
docker-compose down
docker pull mbx92/ocn-system:previous-tag
docker-compose up -d
```

---

## 🔐 Security Notes

- Jangan commit `.env` ke git
- Backup di-encrypt jika berisi data sensitif
- Gunakan secrets management untuk production
- Limit akses ke database backup

---

**Last Updated:** 2026-01-05
