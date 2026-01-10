# 📂 Import Data Historis

Folder ini digunakan untuk menyimpan file Excel yang akan diimport ke sistem OCN.

## 📋 Cara Penggunaan

### 1. Siapkan File Excel

Buat file Excel sesuai format di bawah, simpan di folder ini dengan nama:

- `payments.xlsx` - Data pembayaran
- `projects.xlsx` - Data proyek
- `expenses.xlsx` - Data pengeluaran

### 2. Jalankan Import

```bash
npx tsx prisma/import-historical.ts
```

---

## 📄 Format File Excel

### payments.xlsx

| Column        | Wajib | Contoh           | Keterangan                           |
| ------------- | ----- | ---------------- | ------------------------------------ |
| paymentNumber | ✅    | PAY-20250315-001 | Nomor unik pembayaran                |
| projectNumber | ❌    | PRJ-2025-001     | Link ke proyek (opsional)            |
| amount        | ✅    | 5000000          | Jumlah pembayaran                    |
| discount      | ❌    | 100000           | Diskon                               |
| method        | ❌    | TRANSFER         | CASH / TRANSFER / QRIS               |
| type          | ❌    | FULL             | FULL / DP / INSTALLMENT / SETTLEMENT |
| status        | ❌    | PAID             | PAID / PENDING / UNPAID              |
| paymentDate   | ✅    | 2025-03-15       | **Tanggal pembayaran (backdate)**    |
| paidDate      | ❌    | 2025-03-15       | Tanggal pelunasan                    |
| notes         | ❌    | Lunas via BCA    | Catatan                              |

---

### projects.xlsx

| Column        | Wajib | Contoh         | Keterangan                                |
| ------------- | ----- | -------------- | ----------------------------------------- |
| projectNumber | ✅    | PRJ-2025-001   | Nomor unik proyek                         |
| customerName  | ✅    | PT ABC         | Nama customer                             |
| title         | ✅    | Instalasi CCTV | Judul proyek                              |
| budget        | ✅    | 10000000       | Budget/Nilai proyek                       |
| status        | ❌    | COMPLETED      | QUOTATION/APPROVED/ONGOING/COMPLETED/PAID |
| startDate     | ❌    | 2025-03-01     | Tanggal mulai                             |
| endDate       | ❌    | 2025-03-15     | Tanggal selesai                           |
| createdAt     | ❌    | 2025-02-28     | **Tanggal dibuat (backdate)**             |

---

### expenses.xlsx

| Column      | Wajib | Contoh            | Keterangan                     |
| ----------- | ----- | ----------------- | ------------------------------ |
| description | ✅    | Transport ke site | Deskripsi expense              |
| amount      | ✅    | 150000            | Jumlah                         |
| category    | ❌    | Transport         | Kategori                       |
| type        | ❌    | OPERATIONAL       | OPERATIONAL / PROJECT / SALARY |
| date        | ✅    | 2025-03-15        | **Tanggal expense (backdate)** |

---

## ⚠️ Catatan Penting

1. **Backdate** - Semua tanggal akan diimport sesuai file Excel
2. **Duplikasi** - Record dengan nomor yang sama akan di-skip
3. **Customer** - Jika customer belum ada, akan dibuat otomatis
4. **Backup** - Backup database sebelum import data banyak
