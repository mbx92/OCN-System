# HPP Service/Habis Pakai

## Konsep

**HPP Service/Habis Pakai** adalah akun terpisah di Harga Pokok Penjualan (HPP) untuk mencatat biaya-biaya yang terkait dengan:
- Material habis pakai (kabel, klem, ties, cable clip)
- Sewa/penggunaan alat (tangga, alat krimping)
- Maintenance dan service
- Dana cadangan untuk pembelian asset baru

## Perbedaan dengan HPP Material

| Aspek | HPP Material (dari PO) | HPP Service/Habis Pakai |
|-------|------------------------|-------------------------|
| **Sumber** | Purchase Order | Project Item tanpa PO |
| **Status PO** | ORDERED, RECEIVED | NONE, PENDING |
| **Contoh** | Kamera CCTV, Switch, Kabel UTP | Klem, ties, sewa tangga, maintenance |
| **Keluar Kas** | Ya, via PO | Belum tentu (bisa dari stok/dana cadangan) |

## Cara Kerja di Sistem

### 1. Input di Project Item
Saat membuat project, masukkan biaya service/habis pakai sebagai **Project Item** dengan:
- **Nama**: "Instalasi, Krimping, Pasang" atau "Maintenance CCTV"
- **Cost**: Nilai biaya habis pakai + maintenance
- **PO Status**: **NONE** (tidak perlu PO)
- **Qty**: Sesuai kebutuhan

Contoh:
```
Item: Instalasi, Krimping, Pasang
Qty: 1
Unit: paket
Cost/Unit: Rp 60.000
Total Cost: Rp 60.000
PO Status: NONE
```

### 2. Di Laporan Laba Rugi (Akrual)
Biaya ini akan muncul di:
```
HARGA POKOK PENJUALAN
├─ Material/Items (dari PO)      Rp 36.729.877
├─ Service/Habis Pakai           Rp  1.020.000  ← AKUN INI
└─ Project Expenses              Rp    480.000
   ─────────────────────────────────────────────
   Total HPP                     Rp 38.229.877
```

### 3. Di Cashflow (Basis Kas)
Biaya ini **BELUM keluar kas** karena:
- Menggunakan dana cadangan
- Atau menggunakan stok yang sudah dimiliki
- Atau akan dibeli kemudian saat diperlukan

### 4. Perbedaan Kas vs Akrual
Akan muncul selisih di laporan "Kas vs Akrual":
```
HPP Service/Habis Pakai: Rp 1.020.000
Dana cadangan untuk 31 transaksi (klem, ties, kabel, sewa alat, maintenance)
```

## Cara Pengelolaan Dana Cadangan

### Opsi A: Dana Cadangan Tidak Dicatat
**Status sekarang** - Dana cadangan dianggap sudah termasuk dalam operasional perusahaan.

**Kelebihan:**
- Sederhana, tidak perlu record tambahan
- Cocok untuk usaha kecil/menengah

**Kekurangan:**
- Tidak bisa tracking saldo dana cadangan
- Sulit mengontrol pengeluaran habis pakai

### Opsi B: Catat Dana Cadangan di Cashflow
Jika ingin tracking dana cadangan, buat:

1. **Saat Alokasi Dana:**
```
Category: OPERATIONAL
Description: Alokasi dana habis pakai & maintenance
Amount: Rp 1.500.000 (EXPENSE)
```

2. **Saat Pembelian Habis Pakai:**
```
Category: PROJECT_MATERIAL (atau OPERATIONAL)
Description: Beli klem, ties, kabel untuk stok
Amount: Rp 500.000 (EXPENSE)
Reference: Dari dana cadangan
```

3. **Saat Pakai di Project:**
Sudah tercatat di HPP Service (tidak perlu tambahan cashflow)

### Opsi C: Sistem Inventory (Paling Detail)
Buat modul inventory tracking untuk:
- Track stok barang habis pakai
- Nilai persediaan di Balance Sheet
- FIFO/Average costing
- Monitoring stok minimum

## Interpretasi Laporan

### Skenario Normal
```
Kas Balance:     Rp 12.000.000
Laba Bersih:     Rp 10.000.000
Selisih:         Rp  2.000.000

Breakdown:
- Sisa upah teknisi:      Rp 900.000 (efisiensi)
- HPP Service/Habis Pakai: Rp 1.020.000 (dana cadangan)
- Timing difference:       Rp  80.000
```

**Artinya:**
- Cashflow lebih tinggi Rp 2M dari laba bersih ✅
- Rp 1.020.000 adalah dana yang **seharusnya digunakan** untuk beli habis pakai/maintenance
- Ini adalah **kewajiban** perusahaan untuk memenuhi cost project

### Action Required
Dana Rp 1.020.000 ini **seharusnya:**
1. Disimpan untuk pembelian habis pakai
2. Atau sudah digunakan tapi belum dicatat di cashflow
3. Atau digunakan untuk pembelian asset/alat baru

## Tips Penggunaan

### 1. Tentukan Standar Biaya
Buat standar biaya habis pakai per jenis pekerjaan:
```
Instalasi CCTV 4 kamera:
- Kabel: Rp 30.000
- Klem & ties: Rp 15.000
- Sewa tangga: Rp 15.000
- Total: Rp 60.000
```

### 2. Review Berkala
Setiap bulan/quarter, cek:
- Berapa total HPP Service yang tercatat?
- Apakah sudah dibelanjakan untuk habis pakai?
- Apakah ada sisa yang bisa dijadikan laba?

### 3. Adjustment di Akhir Tahun
Jika ternyata dana cadangan tidak terpakai:
```sql
-- Opsi A: Catat sebagai income (laba)
INSERT INTO CashTransaction (
  type = 'INCOME',
  category = 'OTHER',
  description = 'Adjustment HPP Service tidak terpakai',
  amount = Rp XXX
)

-- Opsi B: Kurangi HPP di tahun berikutnya
-- (Tidak rekomen, bisa bikin laporan tahun berikutnya aneh)
```

## FAQ

**Q: Kenapa tidak langsung catat di cashflow saat pakai?**
A: Karena biaya habis pakai ini sering:
- Dibeli dalam jumlah besar (bulk)
- Dipakai bertahap di banyak project
- Sulit tracking per project

**Q: Apakah selisih ini artinya perusahaan untung lebih besar?**
A: Belum tentu! Selisih ini adalah **kewajiban** untuk memenuhi cost project. Jika tidak dibelanjakan, baru bisa dianggap laba tambahan.

**Q: Bagaimana jika dana ini sudah dipakai tapi lupa dicatat?**
A: Catat sekarang:
```
Category: PROJECT_MATERIAL
Description: Pembelian habis pakai (backdate record)
Amount: Rp XXX
Date: Tanggal pembelian aktual
```

**Q: Apakah harus selalu sama Rp 1.020.000?**
A: Tidak! Jumlah ini akan berubah tiap periode tergantung:
- Jumlah project
- Jenis pekerjaan
- Standar biaya yang ditentukan

## Related Documents

- [Laporan Kas vs Akrual](../app/pages/finance/reports/cash-vs-accrual.vue)
- [API Cash vs Accrual](../server/api/reports/cash-vs-accrual.get.ts)
- [Project Items Management](../app/pages/projects/)

---

**Last Updated:** February 8, 2026
**Version:** 1.0
