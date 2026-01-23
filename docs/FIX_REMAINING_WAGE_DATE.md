# Fix Remaining Wage Date Utility

## Deskripsi

Utilitas untuk memperbaiki tanggal transaksi cashflow sisa upah teknisi agar sesuai dengan periode/tanggal selesai proyek (endDate).

## Problem

Sebelumnya, saat menyimpan sisa upah teknisi ke kas usaha, tanggal transaksi menggunakan tanggal input (saat tombol diklik), bukan tanggal selesai proyek. Ini menyebabkan laporan keuangan tidak akurat karena transaksi tercatat di periode yang salah.

## Solusi

1. **Update Kode Aplikasi** ([profit.vue](../app/pages/finance/profit.vue#L1130-L1172))
   - Fungsi `saveRemainingToCash` sekarang menggunakan `project.endDate` sebagai tanggal transaksi
   - Menampilkan tanggal di dialog konfirmasi

2. **Utilitas untuk Data Lama**
   - API: `/api/utilities/fix-remaining-wage-date`
   - UI: Settings → Utilities → "Perbaiki Tanggal Sisa Upah Teknisi"

## Cara Penggunaan

### Via Frontend (Recommended)

1. Login sebagai Admin/Owner
2. Buka menu **Settings → Utilities**
3. Temukan card **"Perbaiki Tanggal Sisa Upah Teknisi"**
4. Pilih mode:
   - **CHECK**: Melihat data yang perlu diperbaiki (tidak ada perubahan)
   - **EXECUTE**: Memperbaiki tanggal transaksi (permanent)
5. Klik tombol **"Jalankan [MODE]"**
6. Lihat hasilnya di tabel

### Via Script (Manual)

```bash
npx tsx scripts/fix-remaining-wage-date.ts
```

## Mode Operasi

### CHECK Mode

- Menampilkan semua transaksi sisa upah teknisi
- Menandai mana yang perlu update
- Menampilkan perbandingan tanggal saat ini vs tanggal project
- **Tidak mengubah data apapun**

### EXECUTE Mode

- Mengupdate tanggal transaksi ke `endDate` project
- Menampilkan daftar transaksi yang berhasil diupdate
- **Perubahan permanent dan tidak bisa diundo**

## Data yang Terpengaruh

Transaksi cashflow dengan kriteria:

- Type: `INCOME`
- Category: `OTHER`
- Description: mengandung "Sisa upah teknisi"
- ReferenceType: `Project`

## Hasil Update

Tanggal transaksi akan diubah dari tanggal input ke tanggal selesai proyek (endDate), sehingga:

- Laporan Laba-Rugi lebih akurat per periode
- Laporan Cashflow sesuai dengan periode proyek
- Analisa keuangan lebih reliable

## Security

- Hanya Admin dan Owner yang dapat menjalankan utilitas ini
- Mode EXECUTE meminta konfirmasi sebelum eksekusi
- Semua operasi tercatat di log

## Example

```
Transaksi: Sisa upah teknisi dari proyek PRJ-202510-002
- Tanggal Sebelum: 23/1/2026 (tanggal input)
- Tanggal Sesudah: 17/10/2025 (tanggal selesai proyek)
```
