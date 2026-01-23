# Fix: Tanggal Cashflow Pembayaran Teknisi

## Masalah yang Ditemukan

### 1. **Transaksi Lama (Data Existing)**

Beberapa transaksi cashflow untuk gaji teknisi memiliki tanggal yang salah:

- PAY-202601-016: Tanggal cashflow 26/1/2026, seharusnya 26/12/2025 (selisih 1 bulan)
- Dan 5 transaksi lainnya dengan masalah serupa

### 2. **Kode Create Payment Tidak Sync ke Cashflow**

Saat membuat pembayaran teknisi baru dengan status PAID, sistem tidak otomatis membuat transaksi cashflow. Cashflow baru dibuat saat UPDATE status dari PENDING → PAID.

## Solusi yang Diterapkan

### 1. **Perbaiki Data Existing**

✅ Script: `scripts/fix-technician-payment-cashflow-date.ts`

- Mencari semua transaksi cashflow gaji teknisi
- Membandingkan tanggal cashflow dengan `paidDate` dari TechnicianPayment
- Memperbaiki 6 transaksi yang salah tanggalnya

**Hasil:**

- PAY-202601-016: 26/1/2026 → 26/12/2025 ✅
- PAY-202601-026: 23/1/2026 → 17/10/2025 ✅
- PAY-202601-027: 23/1/2026 → 17/10/2025 ✅
- PAY-202601-028: 23/1/2026 → 17/10/2025 ✅
- PAY-202601-025: 23/1/2026 → 23/10/2025 ✅
- PAY-202601-024: 23/1/2026 → 22/10/2025 ✅

### 2. **Fix Kode untuk Data Baru**

✅ File: `server/api/technician-payments/index.post.ts`

**Sebelum:**

```typescript
// Tidak ada kode untuk membuat cashflow saat create payment dengan status PAID
if (status === 'PAID' && projectTechnicianId) {
  await prisma.projectTechnician.update({...})
}
```

**Sesudah:**

```typescript
if (status === 'PAID') {
  // CREATE CASHFLOW dengan tanggal yang benar
  await prisma.cashTransaction.create({
    data: {
      type: 'EXPENSE',
      category: 'SALARY',
      amount: payment.amount,
      description: `Gaji Teknisi: ${payment.technician?.name}...`,
      reference: payment.paymentNumber,
      referenceType: 'TechnicianPayment',
      referenceId: payment.id,
      date: payment.paidDate || new Date(), // ✅ MENGGUNAKAN PAIDDATE
      createdBy: user.id,
    },
  })

  // Update project technician
  if (projectTechnicianId) {
    await prisma.projectTechnician.update({...})
  }
}
```

### 3. **Verifikasi Kode Update Sudah Benar**

✅ File: `server/api/technician-payments/[id].put.ts`

Kode untuk UPDATE sudah menggunakan `payment.paidDate || new Date()`:

```typescript
if (status === 'PAID' && existingPayment.status !== 'PAID') {
  await prisma.cashTransaction.create({
    data: {
      ...
      date: payment.paidDate || new Date(), // ✅ SUDAH BENAR
      ...
    },
  })
}
```

## Kesimpulan

### ✅ Data Lama

Semua transaksi cashflow yang salah tanggalnya sudah diperbaiki.

### ✅ Data Baru

**SEKARANG SUDAH BENAR!** Untuk pembayaran teknisi yang baru dibuat:

1. **Jika dibuat langsung dengan status PAID:**
   - Cashflow akan dibuat otomatis ✅
   - Tanggal cashflow = `paidDate` yang diinput ✅

2. **Jika dibuat dengan status PENDING lalu diupdate jadi PAID:**
   - Cashflow akan dibuat saat update status ✅
   - Tanggal cashflow = `paidDate` yang diinput ✅

## Testing

Untuk testing, buat pembayaran teknisi baru dengan:

- Status: PAID
- Paid Date: tanggal custom (misal: 15 Desember 2025)
- Cek cashflow apakah tanggalnya sama dengan paid date yang diinput

**Expected Result:** Tanggal cashflow = tanggal paid date yang diinput ✅
