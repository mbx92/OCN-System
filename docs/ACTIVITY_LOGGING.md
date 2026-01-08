# Activity Logging System

Sistem logging aktivitas yang komprehensif untuk melacak semua aktivitas penting dalam OCN System.

## Fitur

### 1. **Tracking Otomatis**

- Login/Logout pengguna
- Pembuatan dan perubahan data (Customer, Project, Payment, dll)
- Operasi penting lainnya

### 2. **UI Dashboard**

- Statistik ringkasan (Total Activities, Top Action, Top Entity, Top User)
- Filter komprehensif (Search, Action, Entity, Date Range)
- Timeline display dengan color-coded icons
- Expandable metadata viewer
- Pagination

### 3. **API Endpoints**

#### GET `/api/activities`

Mengambil daftar aktivitas dengan filter dan pagination.

**Query Parameters:**

- `page` - Nomor halaman (default: 1)
- `limit` - Jumlah per halaman (default: 50)
- `userId` - Filter berdasarkan user ID
- `action` - Filter berdasarkan action type
- `entity` - Filter berdasarkan entity type
- `dateFrom` - Filter tanggal mulai (ISO format)
- `dateTo` - Filter tanggal akhir (ISO format)
- `search` - Pencarian dalam metadata

**Response:**

```json
{
  "activities": [
    {
      "id": "...",
      "userId": "...",
      "action": "CREATE_PROJECT",
      "entity": "Project",
      "entityId": "...",
      "metadata": {},
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-01T00:00:00Z",
      "user": {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### GET `/api/activities/stats`

Mengambil statistik aktivitas.

**Query Parameters:**

- `dateFrom` - Filter tanggal mulai (ISO format)
- `dateTo` - Filter tanggal akhir (ISO format)

**Response:**

```json
{
  "total": 100,
  "byAction": [{ "action": "LOGIN", "count": 50 }],
  "byEntity": [{ "entity": "Project", "count": 30 }],
  "byUser": [
    {
      "userId": "...",
      "count": 25,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

## Penggunaan

### 1. Helper Function

Gunakan helper function `logActivity` untuk mencatat aktivitas:

```typescript
import { logActivity, ActivityAction, ActivityEntity } from '../../utils/logger'

// Dalam API endpoint
export default defineEventHandler(async event => {
  const user = event.context.user

  // ... operasi create/update/delete ...

  // Log activity
  if (user) {
    await logActivity({
      userId: user.id,
      action: ActivityAction.CREATE_PROJECT,
      entity: ActivityEntity.Project,
      entityId: project.id,
      metadata: {
        projectNumber: project.projectNumber,
        title: project.title,
        // tambahkan data relevan lainnya
      },
    })
  }

  return result
})
```

### 2. Action Types

Tersedia di `ActivityAction`:

- `LOGIN` - User login
- `LOGOUT` - User logout
- `CREATE_CUSTOMER` - Membuat customer baru
- `UPDATE_CUSTOMER` - Update customer
- `DELETE_CUSTOMER` - Hapus customer
- `CREATE_PROJECT` - Membuat project baru
- `UPDATE_PROJECT` - Update project
- `COMPLETE_PROJECT` - Menyelesaikan project
- `DELETE_PROJECT` - Hapus project
- `CREATE_PAYMENT` - Membuat pembayaran
- `UPDATE_PAYMENT` - Update pembayaran
- `DELETE_PAYMENT` - Hapus pembayaran
- `CREATE_QUOTATION` - Membuat penawaran
- `UPDATE_QUOTATION` - Update penawaran
- `DELETE_QUOTATION` - Hapus penawaran
- `CREATE_PO` - Membuat purchase order
- `UPDATE_PO` - Update purchase order
- `RECEIVE_PO` - Terima purchase order
- `DELETE_PO` - Hapus purchase order
- Dan lainnya...

### 3. Entity Types

Tersedia di `ActivityEntity`:

- `User` - Pengguna
- `Customer` - Pelanggan
- `Project` - Proyek
- `Payment` - Pembayaran
- `Quotation` - Penawaran
- `PurchaseOrder` - Purchase Order
- `Product` - Produk
- `Stock` - Stok
- `Expense` - Pengeluaran
- `Asset` - Aset

### 4. Metadata

Simpan data tambahan yang relevan dalam metadata (JSON):

```typescript
metadata: {
  projectNumber: "PRJ-20240101-001",
  title: "CCTV Installation",
  customerId: "...",
  oldStatus: "PENDING",
  newStatus: "ONGOING",
  // data lain yang diperlukan
}
```

## Best Practices

1. **Selalu log aktivitas penting:**
   - Create, Update, Delete operations
   - Status changes
   - Financial transactions
   - User authentication

2. **Simpan informasi konteks:**
   - ID entitas terkait
   - Status sebelum/sesudah (untuk update)
   - Nilai penting (amount, quantity, dll)

3. **Gunakan constants:**
   - Gunakan `ActivityAction` dan `ActivityEntity` constants
   - Jangan hardcode string action/entity

4. **Check user context:**
   - Selalu cek `event.context.user` sebelum logging
   - Skip logging jika user tidak tersedia (automated processes)

## UI Access

Activity Logs dapat diakses melalui:

1. Menu navigasi: **Settings → Activity Logs**
2. Direct URL: `/settings/activity-logs`

## Testing

Untuk populate sample activities untuk testing:

```bash
npx tsx scripts/populate-activities.ts
```

## Security

- Hanya user dengan permission `settings.view` yang dapat mengakses Activity Logs
- IP Address dan User Agent dicatat untuk audit trail
- Metadata disimpan sebagai JSON untuk fleksibilitas

## Future Enhancements

- [ ] Export activities to CSV/Excel
- [ ] Real-time activity feed
- [ ] Email notifications untuk aktivitas kritis
- [ ] Automatic cleanup old activities (retention policy)
- [ ] Advanced filtering dan search
- [ ] Activity comparison (before/after states)
