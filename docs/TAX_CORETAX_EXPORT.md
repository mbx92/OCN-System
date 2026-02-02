# Export Data untuk Pelaporan Pajak CoreTax

## Overview

Dokumentasi ini menjelaskan cara export data dari sistem OCN untuk pelaporan pajak melalui sistem **CoreTax** (DJP Indonesia). Sistem akan menghasilkan file-file pendukung yang sudah sesuai format CoreTax untuk memudahkan input data.

## Jenis Pelaporan Pajak

### 1. SPT Masa PPh Final (Bulanan)

Lapor setiap bulan paling lambat tanggal 15 bulan berikutnya.

### 2. SPT Tahunan Badan (1771)

Lapor setiap tahun paling lambat 30 April tahun berikutnya.

## Data Mapping: Sistem OCN → CoreTax

### A. SPT Masa PPh Final (Formulir Bulanan)

#### Bagian I: Identitas Wajib Pajak

| Field CoreTax | Sumber Data OCN | Keterangan |
|---------------|-----------------|------------|
| NPWP | `Company.npwp` | Dari tabel Company/Settings |
| Nama Wajib Pajak | `Company.name` | Nama perusahaan |
| Alamat | `Company.address` | Alamat lengkap |
| Masa Pajak | Parameter bulan | 01-12 |
| Tahun Pajak | Parameter tahun | YYYY |

#### Bagian II: Perhitungan PPh

| No | Uraian | Sumber Data | Query |
|----|--------|-------------|-------|
| 1 | Peredaran Bruto (Omzet) | `Payment.amount` | SUM(amount) WHERE status='APPROVED' AND MONTH(approvedDate)=X |
| 2 | Tarif PPh Final | Fixed | 0.5% |
| 3 | PPh Final Terutang | Kalkulasi | (1) × 0.5% |
| 4 | PPh Final yang sudah dibayar | `TaxPayment.taxAmount` | Jika sudah bayar sebelumnya |
| 5 | PPh Final yang kurang/(lebih) dibayar | Kalkulasi | (3) - (4) |

**Format Export CSV:**

```csv
NPWP,Nama,Masa,Tahun,Peredaran_Bruto,Tarif,PPh_Terutang,PPh_Dibayar,Kurang_Lebih_Bayar
01.234.567.8-901.000,PT OCN System,01,2026,38132500,0.005,190662.5,0,190662.5
```

### B. SPT Tahunan Badan - Formulir 1771 (Lampiran Khusus 8A)

Untuk UMKM yang menggunakan PP 55/2022.

#### Bagian A: Peredaran Bruto

| Bulan | Peredaran Bruto | Tarif | PPh Final |
|-------|-----------------|-------|-----------|
| Januari | SUM(Payment) Jan | 0.5% | Rp XXX |
| Februari | SUM(Payment) Feb | 0.5% | Rp XXX |
| ... | ... | ... | ... |
| Desember | SUM(Payment) Des | 0.5% | Rp XXX |
| **Total** | **Total** | | **Total** |

**Sumber Data:**

```sql
SELECT 
  MONTH(approvedDate) as bulan,
  SUM(amount) as peredaran_bruto,
  SUM(amount) * 0.005 as pph_final
FROM Payment
WHERE status = 'APPROVED'
  AND YEAR(approvedDate) = 2026
GROUP BY MONTH(approvedDate)
ORDER BY bulan
```

### C. SPT Tahunan - Lampiran Khusus Laba Rugi

Untuk laporan keuangan yang lebih detail (opsional untuk UMKM).

#### I. PENGHASILAN

| Kode | Uraian | Sumber Data OCN | Query |
|------|--------|-----------------|-------|
| 1a | Penjualan/Peredaran Bruto | `Payment` | SUM(amount) WHERE status='APPROVED' |
| 1b | Dikurangi: Retur Penjualan | - | 0 (tidak ada di sistem) |
| 1c | Dikurangi: Potongan Penjualan | `Payment.discount` | SUM(discount) jika ada |
| **1** | **Penjualan Netto** | | **1a - 1b - 1c** |
| 2 | Harga Pokok Penjualan (HPP) | Lihat detail HPP | |
| **3** | **LABA/(RUGI) BRUTO** | | **1 - 2** |

#### II. HPP (Harga Pokok Penjualan)

| Kode | Uraian | Sumber Data OCN | Query |
|------|--------|-----------------|-------|
| a | Persediaan awal | - | Manual (dari tahun sebelumnya) |
| b | Pembelian | `PurchaseOrder` | SUM(total) WHERE status='RECEIVED' |
| c | Biaya langsung | `ProjectExpense` | SUM(amount) |
| d | Upah langsung | `ProjectItem` (labor) | SUM(technicianCost) |
| e | Biaya overhead pabrik | - | 0 atau manual |
| f | Persediaan akhir | `Product` stock | SUM(stock × avgCost) |
| **Total HPP** | | | **a + b + c + d + e - f** |

**Query HPP Detail:**

```sql
-- Pembelian (PO yang sudah diterima)
SELECT SUM(total) as pembelian
FROM PurchaseOrder
WHERE status = 'RECEIVED'
  AND YEAR(receivedDate) = 2026

-- Biaya Project Expenses
SELECT SUM(amount) as biaya_langsung
FROM ProjectExpense
WHERE YEAR(date) = 2026

-- Upah Teknisi (dari ProjectItem)
SELECT SUM(quantity * technicianCost) as upah_langsung
FROM ProjectItem
JOIN Project ON ProjectItem.projectId = Project.id
WHERE Project.status IN ('COMPLETED', 'APPROVED')
  AND YEAR(Project.completedDate) = 2026
```

#### III. BIAYA USAHA (Operasional)

| Kode | Uraian | Sumber Data OCN | Query |
|------|--------|-----------------|-------|
| 4a | Biaya gaji karyawan | `CashTransaction` | WHERE category='SALARY' |
| 4b | Biaya sewa | `CashTransaction` | WHERE description LIKE '%sewa%' |
| 4c | Biaya listrik/air/telepon | `Expense` | WHERE type='UTILITIES' |
| 4d | Biaya pemasaran | `Expense` | WHERE type='MARKETING' |
| 4e | Biaya transportasi | `Expense` | WHERE type='TRANSPORT' |
| 4f | Biaya pemeliharaan | `Expense` | WHERE type='MAINTENANCE' |
| 4g | Biaya lain-lain | `Expense` | WHERE type='OTHER' |
| **Total Biaya Usaha** | | | **SUM(4a-4g)** |

**Query:**

```sql
-- Total biaya gaji
SELECT SUM(ABS(amount)) as gaji
FROM CashTransaction
WHERE category = 'SALARY'
  AND YEAR(date) = 2026

-- Total biaya operasional lainnya
SELECT 
  type,
  SUM(amount) as total
FROM Expense
WHERE YEAR(date) = 2026
GROUP BY type
```

#### IV. LABA BERSIH

| Kode | Uraian | Kalkulasi |
|------|--------|-----------|
| 5 | LABA/(RUGI) USAHA | (3) - (4) |
| 6 | Penghasilan lain | Manual input |
| 7 | Biaya lain | Manual input |
| **8** | **LABA BERSIH** | **(5) + (6) - (7)** |
| 9 | PPh Final yang sudah dibayar | SUM(TaxPayment.taxAmount) |

### D. SPT Tahunan - Lampiran Neraca

#### HARTA (Assets)

| Kode | Uraian | Sumber Data OCN | Query |
|------|--------|-----------------|-------|
| **A. HARTA LANCAR** | | | |
| 1 | Kas dan Bank | `CashTransaction` | SUM(amount) - saldo akhir |
| 2 | Piutang Usaha | `Payment` | WHERE status='PENDING' |
| 3 | Persediaan Barang | `Product` | SUM(stock × avgCost) |
| **Jumlah Harta Lancar** | | | |
| **B. HARTA TIDAK LANCAR** | | | |
| 4 | Aset Tetap | Manual | Tanah, bangunan, kendaraan |
| 5 | Akumulasi Penyusutan | Manual | Penyusutan aset |
| **Jumlah Harta Tidak Lancar** | | | |
| **TOTAL HARTA** | | | **A + B** |

**Query:**

```sql
-- Saldo Kas (Cashflow)
SELECT 
  SUM(CASE WHEN category IN ('PAYMENT') THEN amount ELSE 0 END) as pemasukan,
  SUM(CASE WHEN category IN ('SALARY', 'PO', 'TAX', 'PROJECT_EXPENSE') THEN ABS(amount) ELSE 0 END) as pengeluaran,
  SUM(amount) as saldo
FROM CashTransaction
WHERE YEAR(date) <= 2026

-- Piutang (Payment yang belum approved)
SELECT SUM(amount) as piutang
FROM Payment
WHERE status = 'PENDING'

-- Persediaan (Stock akhir)
SELECT 
  SUM(stock * avgCost) as nilai_persediaan,
  COUNT(*) as jumlah_item
FROM Product
WHERE stock > 0
```

#### KEWAJIBAN (Liabilities)

| Kode | Uraian | Sumber Data OCN | Query |
|------|--------|-----------------|-------|
| **A. KEWAJIBAN JANGKA PENDEK** | | | |
| 1 | Utang Usaha | `PurchaseOrder` | WHERE status='PENDING' atau 'RECEIVED' tapi belum bayar |
| 2 | Utang Pajak | `TaxPayment` | WHERE status='UNPAID' |
| **Jumlah Kewajiban Jangka Pendek** | | | |
| **B. KEWAJIBAN JANGKA PANJANG** | | | |
| 3 | Utang Bank | Manual | Jika ada pinjaman |
| **TOTAL KEWAJIBAN** | | | **A + B** |

**Query:**

```sql
-- Utang PO (yang sudah received tapi belum bayar)
SELECT 
  COUNT(*) as jumlah_po,
  SUM(total) as total_utang
FROM PurchaseOrder
WHERE status = 'RECEIVED'
  AND id NOT IN (
    SELECT DISTINCT description
    FROM CashTransaction
    WHERE category = 'PO'
  )

-- Utang Pajak
SELECT SUM(taxAmount) as utang_pajak
FROM TaxPayment
WHERE status IN ('UNPAID', 'OVERDUE')
  AND YEAR(dueDate) <= 2026
```

#### MODAL (Equity)

| Kode | Uraian | Kalkulasi |
|------|--------|-----------|
| 1 | Modal Awal | Manual (dari tahun lalu) |
| 2 | Laba/(Rugi) Tahun Berjalan | Dari Laba Rugi |
| **TOTAL MODAL** | | **1 + 2** |

**Rumus Neraca:**
```
TOTAL HARTA = TOTAL KEWAJIBAN + TOTAL MODAL
```

## Format Export Files

### 1. Export Excel: SPT Masa PPh Final (Bulanan)

**File:** `SPT_Masa_PPh_Final_[BULAN]_[TAHUN].xlsx`

**Sheet 1: Ringkasan**
| Field | Value |
|-------|-------|
| NPWP | 01.234.567.8-901.000 |
| Nama WP | PT OCN System |
| Masa Pajak | Januari 2026 |
| Peredaran Bruto | Rp 38.132.500 |
| Tarif PPh Final | 0,5% |
| PPh Terutang | Rp 190.663 |

**Sheet 2: Detail Penjualan**
| No | Tanggal | No Invoice | Customer | Keterangan | Jumlah |
|----|---------|------------|----------|------------|--------|
| 1 | 2026-01-05 | PAY-202601-001 | Customer A | Pembayaran Project X | Rp 5.000.000 |
| ... | ... | ... | ... | ... | ... |

### 2. Export Excel: SPT Tahunan (1771)

**File:** `SPT_Tahunan_[TAHUN].xlsx`

**Sheet 1: Lampiran Khusus 8A - PPh Final UMKM**

| Bulan | Peredaran Bruto | PPh Final (0,5%) | Status Bayar |
|-------|-----------------|------------------|--------------|
| Januari | Rp 38.132.500 | Rp 190.663 | LUNAS |
| Februari | Rp ... | Rp ... | LUNAS |
| ... | ... | ... | ... |
| **TOTAL** | **Rp XXX** | **Rp XXX** | |

**Sheet 2: Laba Rugi**

```
LAPORAN LABA RUGI
PT OCN SYSTEM
Periode: 1 Januari - 31 Desember 2026

I. PENGHASILAN
   Penjualan Bruto                    Rp XXX
   Laba Kotor                         Rp XXX

II. HARGA POKOK PENJUALAN
   Persediaan Awal                    Rp XXX
   Pembelian                          Rp XXX
   Biaya Langsung                     Rp XXX
   Persediaan Akhir                  (Rp XXX)
   Total HPP                         (Rp XXX)

   LABA KOTOR                          Rp XXX

III. BIAYA OPERASIONAL
   Gaji Karyawan                      Rp XXX
   Biaya Operasional Lainnya          Rp XXX
   Total Biaya Operasional           (Rp XXX)

   LABA BERSIH SEBELUM PAJAK          Rp XXX
   PPh Final (0,5%)                  (Rp XXX)
   LABA BERSIH SETELAH PAJAK          Rp XXX
```

**Sheet 3: Neraca**

```
NERACA
PT OCN SYSTEM
Per 31 Desember 2026

HARTA
A. Harta Lancar
   Kas dan Bank                       Rp XXX
   Piutang Usaha                      Rp XXX
   Persediaan                         Rp XXX
   Total Harta Lancar                 Rp XXX

B. Harta Tidak Lancar
   Aset Tetap                         Rp XXX
   Akumulasi Penyusutan              (Rp XXX)
   Total Harta Tidak Lancar           Rp XXX

TOTAL HARTA                           Rp XXX

KEWAJIBAN DAN MODAL
A. Kewajiban Jangka Pendek
   Utang Usaha                        Rp XXX
   Utang Pajak                        Rp XXX
   Total Kewajiban                    Rp XXX

B. Modal
   Modal Awal                         Rp XXX
   Laba Tahun Berjalan                Rp XXX
   Total Modal                        Rp XXX

TOTAL KEWAJIBAN + MODAL               Rp XXX
```

**Sheet 4: Bukti Pembayaran Pajak**

| Masa | Tgl Bayar | NTPN/Billing | Jumlah | Bukti |
|------|-----------|--------------|--------|-------|
| Jan 2026 | 2026-02-10 | 123XXX | Rp 190.663 | ✓ |
| ... | ... | ... | ... | ... |

### 3. Export CSV untuk Import CoreTax

**File:** `coretax_pph_final_masa_[YYYYMM].csv`

```csv
masa_pajak,tahun_pajak,peredaran_bruto,tarif_persen,pph_terutang,pph_dibayar,status
01,2026,38132500,0.5,190662.5,190662.5,LUNAS
```

**File:** `coretax_pph_final_tahunan_[YYYY].csv`

```csv
bulan,peredaran_bruto,pph_final,tanggal_bayar,ntpn
01,38132500,190662.5,2026-02-10,12345678901234567
02,25000000,125000,2026-03-12,12345678901234568
...
```

## API Endpoints untuk Export

### 1. Export SPT Masa (Excel)

```
GET /api/tax/export/masa/:year/:month
```

**Response:** File Excel

### 2. Export SPT Tahunan (Excel)

```
GET /api/tax/export/annual/:year
```

**Response:** File Excel dengan multiple sheets

### 3. Export CSV untuk CoreTax

```
GET /api/tax/export/coretax/masa/:year/:month
GET /api/tax/export/coretax/annual/:year
```

**Response:** File CSV

### 4. Export Laba Rugi (Excel/PDF)

```
GET /api/reports/profit-loss/:year?format=xlsx
GET /api/reports/profit-loss/:year?format=pdf
```

### 5. Export Neraca (Excel/PDF)

```
GET /api/reports/balance-sheet/:year?format=xlsx
GET /api/reports/balance-sheet/:year?format=pdf
```

### 6. Export Detail Penjualan

```
GET /api/reports/sales-detail/:year/:month?format=xlsx
```

**Columns:**
- Tanggal
- No Invoice
- Customer
- Project
- Keterangan
- Jumlah (Rp)

### 7. Export Detail Pembelian

```
GET /api/reports/purchase-detail/:year/:month?format=xlsx
```

**Columns:**
- Tanggal
- No PO
- Supplier
- Keterangan
- Jumlah (Rp)

## Library untuk Export

### Excel Export (ExcelJS)

```bash
npm install exceljs
```

```typescript
import ExcelJS from 'exceljs';

async function exportSPTMasa(year: number, month: number) {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Ringkasan
  const sheet1 = workbook.addWorksheet('Ringkasan');
  sheet1.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  
  // Add data...
  sheet1.addRow({ field: 'NPWP', value: '...' });
  
  // Sheet 2: Detail Penjualan
  const sheet2 = workbook.addWorksheet('Detail Penjualan');
  // ...
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
```

### PDF Export (jsPDF / Puppeteer)

```bash
npm install puppeteer
```

```typescript
import puppeteer from 'puppeteer';

async function exportLaporanPDF(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(html);
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
  return pdf;
}
```

## Checklist Data yang Dibutuhkan CoreTax

### Data Perusahaan (Master)
- [ ] NPWP (15 digit)
- [ ] Nama Badan
- [ ] Alamat lengkap
- [ ] Kode KLU (Klasifikasi Lapangan Usaha)
- [ ] Nama PIC (Penanggung Jawab)
- [ ] No Telepon
- [ ] Email

### Data Transaksi Bulanan
- [ ] Total Peredaran Bruto (Omzet)
- [ ] Detail penjualan (tanggal, invoice, customer, jumlah)
- [ ] PPh Final 0,5%
- [ ] Tanggal pembayaran
- [ ] NTPN (Nomor Transaksi Penerimaan Negara)
- [ ] Bukti pembayaran (PDF)

### Data Tahunan
- [ ] Laporan Laba Rugi lengkap
- [ ] Neraca (Harta, Kewajiban, Modal)
- [ ] Rekap pembayaran PPh Final 12 bulan
- [ ] Daftar aset tetap (jika ada)
- [ ] Bukti pembayaran pajak setahun
- [ ] Rekening koran (opsional)

### Dokumen Pendukung
- [ ] Faktur penjualan
- [ ] Kwitansi pembayaran
- [ ] Invoice pembelian
- [ ] Bukti transfer/pembayaran
- [ ] Kontrak kerja (jika ada)

## UI Feature: Tax Export Page

### Menu: Keuangan > Pajak > Export Data

**Sections:**

1. **Export SPT Masa PPh Final**
   - Pilih bulan & tahun
   - Preview data
   - Download Excel
   - Download CSV (CoreTax)

2. **Export SPT Tahunan**
   - Pilih tahun
   - Preview summary
   - Download Excel (lengkap dengan Laba Rugi & Neraca)
   - Download PDF

3. **Export Laporan Pendukung**
   - Laba Rugi (Excel/PDF)
   - Neraca (Excel/PDF)
   - Detail Penjualan (Excel)
   - Detail Pembelian (Excel)
   - Rekap Pembayaran Pajak (Excel)

4. **Template CoreTax**
   - Download template CSV kosong
   - Download panduan pengisian
   - Link ke panduan CoreTax DJP

## Validasi Data Sebelum Export

### Checklist Validasi

```typescript
async function validateDataBeforeExport(year: number, month?: number) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Check company data
  const company = await getCompanyData();
  if (!company.npwp) errors.push('NPWP belum diisi');
  if (!company.address) errors.push('Alamat perusahaan belum lengkap');
  
  // 2. Check tax payments
  const tax = await getTaxPayment(year, month);
  if (!tax) warnings.push('Data pajak belum tercatat di sistem');
  if (tax?.status !== 'PAID') warnings.push('Pajak belum dibayar');
  
  // 3. Check cashflow balance
  const cashflow = await getCashflowBalance(year, month);
  const profitLoss = await getProfitLoss(year, month);
  const diff = Math.abs(cashflow - profitLoss);
  if (diff > 1000000) {
    warnings.push(`Selisih cashflow vs laba rugi: Rp ${diff.toLocaleString()}`);
  }
  
  // 4. Check missing data
  const payments = await getPaymentsWithoutInvoice(year, month);
  if (payments.length > 0) {
    warnings.push(`${payments.length} pembayaran tanpa nomor invoice`);
  }
  
  return { errors, warnings };
}
```

## Migration Plan

### Phase 1: Core Export (Week 1)
- [ ] API endpoint export SPT Masa (Excel)
- [ ] API endpoint export CSV CoreTax
- [ ] Basic UI export page

### Phase 2: Annual Report (Week 2)
- [ ] Laba Rugi generator
- [ ] Neraca generator
- [ ] Export SPT Tahunan

### Phase 3: Supporting Docs (Week 3)
- [ ] Detail penjualan export
- [ ] Detail pembelian export
- [ ] Bukti pembayaran pajak

### Phase 4: Validation & Enhancement (Week 4)
- [ ] Data validation before export
- [ ] Preview before download
- [ ] Templates & guides

## Tips Pengisian CoreTax

1. **Persiapan Data:**
   - Export semua data dari sistem OCN
   - Validasi kelengkapan data
   - Siapkan bukti pembayaran

2. **Input Bertahap:**
   - Mulai dari data perusahaan
   - Input data bulanan secara berurutan
   - Simpan draft berkala

3. **Validasi di CoreTax:**
   - Pastikan total omzet sudah benar
   - Cek perhitungan PPh Final
   - Validasi NTPN pembayaran

4. **Dokumen Pendukung:**
   - Upload bukti pembayaran
   - Simpan screenshot konfirmasi
   - Cetak bukti pelaporan

## References

- [CoreTax DJP](https://coretax.pajak.go.id)
- [Panduan CoreTax](https://www.pajak.go.id/id/panduan-coretax)
- [PP 55/2022 - PPh Final UMKM](https://peraturan.bpk.go.id/Home/Details/229244/pp-no-55-tahun-2022)
- [Format SPT 1771](https://www.pajak.go.id/id/formulir-spt-tahunan-pph-badan)
