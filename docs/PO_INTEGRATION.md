# Purchase Order System Integration

## 📋 Overview

Sistem PO (Purchase Order) terintegrasi dengan Project untuk mengatur pengadaan barang yang dibutuhkan, baik dari **budget quotation** maupun **item maintenance tambahan**.

## 🔄 Flow PO Creation

### 1. **Dari Quotation** (Flow Utama)

```
Quotation → Approve → Project Created
  ↓
Items masuk sebagai ProjectItem (type: QUOTATION)
  ↓
Check stok produk:
  - Jika stok cukup → Reserve stok
  - Jika stok kurang → needsPo = true, poStatus = PENDING
  ↓
Buat PO dari Pending Items
```

### 2. **Dari Maintenance Project** (Tambahan Manual)

```
Maintenance Schedule → Create Project (type: MNT-YYMM-XXX)
  ↓
Tambah Item Manual → ProjectItem (type: ADDITIONAL)
  ↓
Check stok produk:
  - Jika stok cukup → Reserve stok
  - Jika stok kurang → needsPo = true, poStatus = PENDING
  ↓
Buat PO dari Pending Items (sama dengan quotation items)
```

## 🎯 Fitur Utama

### Auto-detect PO Requirements

Sistem otomatis mendeteksi item yang perlu PO berdasarkan:

1. **Product Type**: Bukan service (`isService = false`)
2. **Stock Availability**: Stok available < quantity yang dibutuhkan
3. **Auto Flag**: Set `needsPo = true` dan `poStatus = PENDING`

### Pending Items List

Item dengan `poStatus = PENDING` akan muncul di:

- **Purchase Orders Page** → Tab "Create PO"
- Filter by project or view all pending items
- Bisa create PO langsung dari list

## 📊 Item Types

### QUOTATION Items

- Dari approved quotation
- Sudah ada estimasi harga (price & cost)
- Auto-flagged jika stok kurang

### ADDITIONAL Items

- Ditambahkan manual di halaman project
- Untuk maintenance atau kebutuhan tambahan
- **BARU**: Sekarang juga auto-flagged jika stok kurang! ✅

## 🛠️ Implementation Details

### API Endpoint: Add Item to Project

**File**: `server/api/projects/[id]/items.post.ts`

```typescript
// Check if item needs PO
let needsPo = false
let poStatus = 'NONE'

if (productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      isService: true,
      stock: { select: { available: true } },
    },
  })

  // If not a service and stock insufficient
  if (product && !product.isService) {
    const availableStock = product.stock?.available || 0
    if (availableStock < quantity) {
      needsPo = true
      poStatus = 'PENDING'
    }
  }
}

// Create item with PO flags
await prisma.projectItem.create({
  data: {
    // ... other fields
    needsPo,
    poStatus,
  },
})
```

### Database Schema

```prisma
model ProjectItem {
  id          String   @id @default(cuid())
  projectId   String
  productId   String?
  name        String
  quantity    Int
  unit        String
  price       Decimal
  cost        Decimal
  type        String   // 'QUOTATION' | 'ADDITIONAL'
  needsPo     Boolean  @default(false)
  poStatus    String   @default("NONE") // 'NONE' | 'PENDING' | 'ORDERED'
  // ...
}
```

## 🔧 Migration Script

Untuk fix existing ADDITIONAL items yang belum punya flag PO:

```bash
npx tsx scripts/fix-additional-items-po.ts
```

Script ini akan:

1. Scan semua item dengan `type = ADDITIONAL`
2. Check stok availability
3. Update `needsPo` dan `poStatus` sesuai kondisi

## 📝 Example Usage

### Scenario 1: Maintenance Project

1. Buat Maintenance Schedule
2. Complete & Create Project
3. **Tambah Item** (e.g., Kabel RG59 - 20 meter)
4. Sistem check stok:
   - Available: 0 meter
   - Needed: 20 meter
   - **Auto set**: needsPo = true, poStatus = PENDING
5. Buka **Purchase Orders** → "Create PO"
6. **Item muncul di list!** ✅

### Scenario 2: Regular Project

1. Create Quotation
2. Approve → Jadi Project
3. Items from quotation auto-flagged
4. **Purchase Orders** → "Create PO"
5. Pilih items & create PO

## 🎨 UI Flow

### Purchase Orders Page

**Tab 1: PO List**

- Daftar semua PO (DRAFT, APPROVED, RECEIVED)

**Tab 2: Create PO**

```
1. Select Supplier
2. View Pending Items:
   ┌────────────────────────────────────────┐
   │ ☑ RG59 Belden (MNT-2601-002)          │
   │   Type: ADDITIONAL                      │
   │   Need: 20 meter | Available: 0        │
   ├────────────────────────────────────────┤
   │ ☑ SD Card Kingston (PRJ-202601-002)   │
   │   Type: QUOTATION                       │
   │   Need: 4 pcs | Available: 0           │
   └────────────────────────────────────────┘
3. Create PO Button
```

**Tab 3: Create Direct PO**

- Manual input items (tidak perlu project)

## ✅ Benefits

1. **Unified System**: Quotation items & Additional items sama-sama bisa PO
2. **Auto Detection**: Sistem otomatis deteksi kebutuhan PO
3. **Stock Control**: Prevent overselling dengan auto-reserve
4. **Visibility**: Semua pending items dalam satu view
5. **Flexibility**: Support regular project & maintenance project

## 🚀 Testing

Check pending items:

```bash
npx tsx scripts/check-pending-po-items.ts
```

Expected output:

```
📋 Items with PENDING PO Status:

┌─────────┬──────────────────┬────────────┬────────────────┬──────────────┐
│ Project │ Status           │ Item       │ Type         │ PO Status    │
├─────────┼──────────────────┼────────────┼──────────────┼──────────────┤
│ MNT-... │ ONGOING          │ RG59...    │ ADDITIONAL   │ PENDING      │
│ PRJ-... │ APPROVED         │ SD Card... │ QUOTATION    │ PENDING      │
└─────────┴──────────────────┴────────────┴──────────────┴──────────────┘
```

## 🎯 Next Steps

- [ ] Add batch PO creation from multiple projects
- [ ] Auto-suggest supplier based on product history
- [ ] Email notification to suppliers
- [ ] PO approval workflow (for large orders)

---

**Updated**: January 8, 2026
**Status**: ✅ Fully Implemented
