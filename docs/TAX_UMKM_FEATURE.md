# Fitur Pajak UMKM - PPh Final 0,5%

## Overview

Fitur untuk menghitung, mencatat, dan melaporkan PPh Final UMKM sesuai PP 55/2022 yang mewajibkan pembayaran pajak 0,5% dari omzet bulanan.

## Peraturan Pajak UMKM Indonesia

### PPh Final UMKM (PP 55/2022)

**Kriteria:**

- Omzet ≤ Rp 4,8 miliar/tahun: Kena PPh Final 0,5%
- Omzet ≤ Rp 500 juta/tahun: BEBAS pajak (tetap wajib lapor)

**Tarif:** 0,5% dari peredaran bruto (omzet) bulanan

**Kewajiban:**

- **Bulanan:** Bayar PPh Final paling lambat tanggal 15 bulan berikutnya
- **Tahunan:** Lapor SPT 1770/1770S setiap bulan Maret

**Sanksi:**

- Terlambat bayar: Bunga 2% per bulan
- Tidak lapor SPT: Denda Rp 100.000

### Formula Perhitungan

```
PPh Final Bulanan = Total Omzet Bulan Ini × 0,5%
```

**Contoh:**

- Omzet Januari 2026: Rp 38.132.500
- PPh Final: Rp 38.132.500 × 0,5% = Rp 190.662
- Jatuh Tempo: 15 Februari 2026

## Database Schema

### Tabel: TaxPayment

```prisma
model TaxPayment {
  id                String   @id @default(cuid())

  // Period
  year              Int      // Tahun pajak
  month             Int      // Bulan pajak (1-12)

  // Calculation
  omzet             Decimal  @db.Decimal(15, 2) // Total omzet bulan ini
  taxRate           Decimal  @db.Decimal(5, 4)  // Default: 0.005 (0.5%)
  taxAmount         Decimal  @db.Decimal(15, 2) // Jumlah pajak yang harus dibayar

  // Payment
  dueDate           DateTime // Tanggal jatuh tempo (tanggal 15 bulan berikutnya)
  paymentDate       DateTime? // Tanggal aktual pembayaran
  status            TaxPaymentStatus @default(UNPAID)

  // Documentation
  billingCode       String?  // Kode billing dari DJP Online
  paymentProof      String?  // Path ke bukti pembayaran (upload)
  notes             String?  @db.Text

  // Relations
  cashTransactionId String?  @unique
  cashTransaction   CashTransaction? @relation(fields: [cashTransactionId], references: [id])

  // Audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?
  updatedBy         String?

  @@unique([year, month])
  @@index([status, dueDate])
  @@index([year, month])
}

enum TaxPaymentStatus {
  UNPAID      // Belum dibayar
  PAID        // Sudah dibayar
  OVERDUE     // Terlambat (lewat tanggal 15)
  EXEMPTED    // Bebas pajak (omzet < 500jt/tahun)
}
```

### Update Tabel: CashTransaction

Tambah kategori baru untuk pembayaran pajak:

```prisma
enum CashTransactionCategory {
  // ... existing categories
  TAX         // Pembayaran pajak
}
```

## API Endpoints

### 1. GET /api/tax/calculate/:year/:month

Hitung PPh Final untuk periode tertentu (preview).

**Response:**

```json
{
  "year": 2026,
  "month": 1,
  "period": "Januari 2026",
  "omzet": 38132500,
  "taxRate": 0.005,
  "taxAmount": 190662.5,
  "dueDate": "2026-02-15",
  "status": "UNPAID",
  "daysUntilDue": 13,
  "isOverdue": false
}
```

### 2. POST /api/tax/record

Catat PPh Final untuk periode tertentu.

**Request:**

```json
{
  "year": 2026,
  "month": 1,
  "billingCode": "123456789012345",
  "notes": "PPh Final Januari 2026"
}
```

**Response:**

```json
{
  "id": "tax_xxx",
  "year": 2026,
  "month": 1,
  "omzet": 38132500,
  "taxAmount": 190662.5,
  "dueDate": "2026-02-15",
  "status": "UNPAID"
}
```

### 3. POST /api/tax/pay/:id

Catat pembayaran pajak dan buat cashflow.

**Request:**

```json
{
  "paymentDate": "2026-02-10",
  "paymentProof": "/uploads/tax-jan-2026.pdf",
  "notes": "Dibayar via e-Billing"
}
```

**Response:**

```json
{
  "taxPayment": {
    "id": "tax_xxx",
    "status": "PAID",
    "paymentDate": "2026-02-10"
  },
  "cashTransaction": {
    "id": "cash_xxx",
    "amount": -190662.5,
    "category": "TAX"
  }
}
```

### 4. GET /api/tax/list

List semua pembayaran pajak dengan filter.

**Query Params:**

- `year`: Filter tahun
- `status`: Filter status (UNPAID, PAID, OVERDUE, EXEMPTED)
- `page`: Halaman (default: 1)
- `limit`: Jumlah per halaman (default: 12)

**Response:**

```json
{
  "data": [
    {
      "id": "tax_xxx",
      "year": 2026,
      "month": 1,
      "period": "Januari 2026",
      "omzet": 38132500,
      "taxAmount": 190662.5,
      "dueDate": "2026-02-15",
      "paymentDate": "2026-02-10",
      "status": "PAID"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
}
```

### 5. GET /api/tax/annual-report/:year

Laporan pajak tahunan untuk SPT.

**Response:**

```json
{
  "year": 2026,
  "totalOmzet": 450000000,
  "totalTax": 2250000,
  "isExempted": false,
  "months": [
    {
      "month": 1,
      "omzet": 38132500,
      "taxAmount": 190662.5,
      "status": "PAID",
      "paymentDate": "2026-02-10"
    }
  ],
  "summary": {
    "paid": 1,
    "unpaid": 0,
    "overdue": 0,
    "totalPaid": 190662.5,
    "totalUnpaid": 0
  }
}
```

### 6. GET /api/tax/upcoming

Daftar pajak yang akan jatuh tempo (reminder).

**Response:**

```json
{
  "upcoming": [
    {
      "id": "tax_xxx",
      "period": "Januari 2026",
      "dueDate": "2026-02-15",
      "taxAmount": 190662.5,
      "daysUntilDue": 13,
      "status": "UNPAID"
    }
  ]
}
```

### 7. POST /api/tax/auto-calculate

Auto-generate tax records untuk bulan-bulan yang belum tercatat.

**Request:**

```json
{
  "fromYear": 2025,
  "fromMonth": 1,
  "toYear": 2026,
  "toMonth": 1
}
```

## UI Components

### 1. Halaman Pajak (`/finance/tax`)

**Sections:**

- **Summary Card:**
  - Total omzet tahun berjalan
  - Total pajak yang harus dibayar
  - Pajak yang sudah dibayar
  - Pajak yang belum dibayar
  - Status SPT Tahunan

- **Upcoming Payments (Alert Box):**
  - Daftar pajak yang akan jatuh tempo
  - Days until due
  - Quick pay button

- **Monthly Tax Table:**
  - Periode (bulan/tahun)
  - Omzet
  - PPh Final (0,5%)
  - Jatuh Tempo
  - Status (badge)
  - Tanggal Bayar
  - Actions (Bayar, Detail, Upload Bukti)

- **Filters:**
  - Pilih tahun
  - Filter status

### 2. Form Pembayaran Pajak

**Fields:**

- Periode (read-only)
- Omzet (read-only)
- Jumlah Pajak (read-only)
- Jatuh Tempo (read-only)
- Tanggal Pembayaran (date picker)
- Kode Billing (optional)
- Upload Bukti Pembayaran (file upload)
- Catatan

**Validations:**

- Payment date harus diisi
- File upload max 5MB (PDF/JPG/PNG)

### 3. Modal Detail Pajak

**Display:**

- Informasi periode
- Breakdown omzet (dari Payments)
- Perhitungan pajak
- Status pembayaran
- Timeline:
  - Created date
  - Due date
  - Payment date (if paid)
- Download bukti pembayaran
- Link ke cashflow transaction

### 4. Widget Dashboard (Home)

**Tax Status Widget:**

- Bulan ini: Status bayar/belum
- Upcoming: Next payment due
- Tahun ini: Total paid vs unpaid
- Quick link ke halaman pajak

### 5. Annual Tax Report

**Format Export (PDF/Excel):**

- Header: Nama perusahaan, NPWP, tahun
- Tabel bulanan:
  - Bulan
  - Omzet
  - PPh Final
  - Status
  - Tanggal Bayar
- Total:
  - Total Omzet Tahunan
  - Total PPh Final
  - Total Dibayar
  - Total Belum Dibayar

## Business Logic

### Auto-Calculate Tax

Fungsi untuk generate tax record otomatis setiap bulan:

```typescript
async function autoCalculateTax(year: number, month: number) {
  // 1. Check if already exists
  const existing = await prisma.taxPayment.findUnique({
    where: { year_month: { year, month } },
  })

  if (existing) {
    throw new Error('Tax record already exists')
  }

  // 2. Calculate omzet from payments
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const payments = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      approvedDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amount: true },
  })

  const omzet = payments._sum.amount || 0

  // 3. Calculate tax (0.5%)
  const taxRate = 0.005
  const taxAmount = omzet * taxRate

  // 4. Calculate due date (15th next month)
  const dueDate = new Date(year, month, 15)

  // 5. Determine status
  let status: TaxPaymentStatus = 'UNPAID'

  // Check if exempted (annual omzet < 500jt)
  const yearlyOmzet = await getYearlyOmzet(year)
  if (yearlyOmzet < 500000000) {
    status = 'EXEMPTED'
  }

  // 6. Create tax record
  const taxPayment = await prisma.taxPayment.create({
    data: {
      year,
      month,
      omzet,
      taxRate,
      taxAmount,
      dueDate,
      status,
    },
  })

  return taxPayment
}
```

### Pay Tax

Fungsi untuk mencatat pembayaran pajak:

```typescript
async function payTax(taxId: string, paymentDate: Date, paymentProof?: string, notes?: string) {
  // 1. Get tax record
  const tax = await prisma.taxPayment.findUnique({
    where: { id: taxId },
  })

  if (!tax) throw new Error('Tax not found')
  if (tax.status === 'PAID') throw new Error('Already paid')
  if (tax.status === 'EXEMPTED') throw new Error('Tax is exempted')

  // 2. Create cashflow transaction
  const cashTransaction = await prisma.cashTransaction.create({
    data: {
      date: paymentDate,
      amount: -tax.taxAmount, // Negative (expense)
      category: 'TAX',
      description: `PPh Final UMKM 0,5% - ${getMonthName(tax.month)} ${tax.year}`,
      notes: notes || `Pembayaran PPh Final periode ${getMonthName(tax.month)} ${tax.year}`,
    },
  })

  // 3. Update tax record
  const updatedTax = await prisma.taxPayment.update({
    where: { id: taxId },
    data: {
      status: 'PAID',
      paymentDate,
      paymentProof,
      notes,
      cashTransactionId: cashTransaction.id,
    },
  })

  return { taxPayment: updatedTax, cashTransaction }
}
```

### Check Overdue

Fungsi untuk update status overdue (run via cron):

```typescript
async function checkOverdueTax() {
  const today = new Date()

  // Update all unpaid tax that passed due date
  const result = await prisma.taxPayment.updateMany({
    where: {
      status: 'UNPAID',
      dueDate: { lt: today },
    },
    data: {
      status: 'OVERDUE',
    },
  })

  return result
}
```

### Calculate Penalty

Fungsi untuk hitung denda keterlambatan:

```typescript
function calculatePenalty(tax: TaxPayment, paymentDate: Date): number {
  if (!tax.dueDate || tax.status !== 'OVERDUE') return 0

  // Calculate months late
  const monthsDiff = Math.ceil(
    (paymentDate.getTime() - tax.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  if (monthsDiff <= 0) return 0

  // Penalty: 2% per month
  const penaltyRate = 0.02
  const penalty = tax.taxAmount * penaltyRate * monthsDiff

  return penalty
}
```

## Notifications & Reminders

### Email/Telegram Notification

**Trigger Points:**

1. **7 hari sebelum jatuh tempo:**
   - "Reminder: PPh Final Januari 2026 jatuh tempo 15 Feb 2026"
   - Amount: Rp 190.662

2. **1 hari sebelum jatuh tempo:**
   - "Urgent: PPh Final jatuh tempo besok!"

3. **Lewat jatuh tempo:**
   - "Overdue: PPh Final Januari 2026 belum dibayar"
   - Penalty info

### Dashboard Badge

- Red badge: Ada yang overdue
- Yellow badge: Ada yang jatuh tempo < 7 hari
- Green: Semua lancar

## Cron Jobs

### 1. Auto Generate Monthly Tax

**Schedule:** Tanggal 1 setiap bulan, jam 01:00
**Action:** Generate tax record untuk bulan sebelumnya

```typescript
// cron: 0 1 1 * *
async function autoGenerateMonthlyTax() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const year = lastMonth.getFullYear()
  const month = lastMonth.getMonth() + 1

  await autoCalculateTax(year, month)
}
```

### 2. Check Overdue Daily

**Schedule:** Setiap hari jam 08:00
**Action:** Update status UNPAID → OVERDUE jika lewat due date

```typescript
// cron: 0 8 * * *
async function dailyCheckOverdue() {
  await checkOverdueTax()
}
```

### 3. Send Reminders

**Schedule:** Setiap hari jam 09:00
**Action:** Kirim reminder untuk pajak yang akan jatuh tempo

```typescript
// cron: 0 9 * * *
async function sendTaxReminders() {
  const today = new Date()
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  // Find taxes due in 7 days
  const upcomingTaxes = await prisma.taxPayment.findMany({
    where: {
      status: 'UNPAID',
      dueDate: {
        gte: today,
        lte: sevenDaysLater,
      },
    },
  })

  for (const tax of upcomingTaxes) {
    await sendTaxReminder(tax)
  }
}
```

## Reports & Analytics

### Tax Dashboard Analytics

1. **YTD Summary:**
   - Total omzet tahun ini
   - Total pajak tahun ini
   - Rata-rata pajak per bulan
   - Compliance rate (% paid on time)

2. **Monthly Trend Chart:**
   - Line chart: Omzet vs Pajak
   - Bar chart: Status pembayaran

3. **Compliance Metrics:**
   - Paid on time: X months
   - Late payments: X months
   - Average days late

## Testing Checklist

### Unit Tests

- [ ] Calculate tax correctly (0.5%)
- [ ] Calculate due date (15th next month)
- [ ] Determine exemption status (< 500jt)
- [ ] Calculate penalty for late payment
- [ ] Generate tax for all months

### Integration Tests

- [ ] Create tax record
- [ ] Pay tax and create cashflow
- [ ] Cannot pay twice
- [ ] Cannot pay exempted tax
- [ ] Update overdue status
- [ ] Generate annual report

### E2E Tests

- [ ] Complete flow: Calculate → Pay → Verify cashflow
- [ ] Upload payment proof
- [ ] Export annual report PDF
- [ ] Reminder notifications

## Migration Plan

### Phase 1: Database (Week 1)

1. Create TaxPayment model
2. Add TAX category to CashTransaction
3. Run migration
4. Seed historical data (if needed)

### Phase 2: Backend API (Week 1-2)

1. Implement tax calculation logic
2. Create all API endpoints
3. Add validation & error handling
4. Unit tests

### Phase 3: Frontend UI (Week 2-3)

1. Create tax page & components
2. Integrate with API
3. Add file upload for payment proof
4. Dashboard widget

### Phase 4: Automation (Week 3)

1. Setup cron jobs
2. Implement notifications
3. Add reminder system

### Phase 5: Testing & Launch (Week 4)

1. Integration testing
2. User acceptance testing
3. Documentation
4. Production deployment

## Future Enhancements

1. **e-Billing Integration:**
   - Auto-generate billing code via DJP API
   - Direct payment via virtual account

2. **e-Filing SPT:**
   - Export SPT 1770 format
   - Submit via DJP Online API

3. **Multi-tax Support:**
   - PPN (jika sudah PKP)
   - PPh 21 (karyawan)
   - PPh 23 (jasa)

4. **Tax Planning:**
   - Prediksi pajak bulan depan
   - Forecast annual tax
   - Tax optimization suggestions

5. **Audit Trail:**
   - Complete history of tax changes
   - Who calculated, who paid, when

## References

- [PP 55/2022 - PPh Final UMKM](https://peraturan.bpk.go.id/Home/Details/229244/pp-no-55-tahun-2022)
- [DJP Online](https://djponline.pajak.go.id)
- [Panduan e-Billing](https://www.pajak.go.id/id/e-billing)
