# Edit Quantity on Draft PO

## 🎯 Feature Overview

Fitur untuk mengedit quantity item pada Purchase Order yang berstatus **DRAFT**.

## ✨ Features

### 1. Edit Quantity

- ✅ Inline editing - Click pada quantity untuk edit
- ✅ Auto-recalculate total per item
- ✅ Auto-recalculate PO total amount
- ✅ Keyboard shortcuts (Enter = Save, Esc = Cancel)
- ✅ Visual feedback (Save/Cancel buttons)

### 2. Delete Item

- ✅ Hapus item dari PO DRAFT
- ✅ Auto-update PO total amount
- ✅ Prevent deleting last item (min 1 item)
- ✅ Return projectItem poStatus to PENDING if deleted

## 🔒 Restrictions

- ❌ Only **DRAFT** PO can be edited
- ❌ Cannot delete last item (min 1 item required)
- ✅ Quantity must be >= 1

## 🎨 UI/UX

### Edit Mode

1. Click pada quantity number
2. Input field muncul dengan current value
3. Change value
4. Press Enter atau click ✓ button
5. Press Esc atau click ✕ button untuk cancel

### Delete Item

1. Click trash icon di sebelah kanan item
2. Confirmation dialog muncul
3. Confirm → Item dihapus & total updated

## 📊 Visual Indicators

- **Hover effect** pada quantity (clickable)
- **Input field** saat edit mode
- **Save/Cancel buttons** saat edit mode
- **Total recalculation** real-time di UI

## 🔧 API Endpoints

### PATCH `/api/purchase-orders/:id/items/:itemId`

Update quantity item PO.

**Request:**

```json
{
  "quantity": 15
}
```

**Response:**

```json
{
  "success": true
}
```

**Validation:**

- PO must be DRAFT
- Quantity >= 1
- Auto-recalculate item total
- Auto-update PO totalAmount

### DELETE `/api/purchase-orders/:id/items/:itemId`

Delete item from PO.

**Response:**

```json
{
  "success": true
}
```

**Validation:**

- PO must be DRAFT
- Cannot delete last item (min 1 item)
- Auto-update PO totalAmount
- Return projectItem.poStatus to PENDING

## 🎯 Use Cases

### Scenario 1: Adjust Quantity

```
PO-202601-001 (DRAFT)
  - Kabel RG59: 20 meter x Rp 9.000 = Rp 180.000

Click "20" → Change to "25" → Save

PO-202601-001 (DRAFT)
  - Kabel RG59: 25 meter x Rp 9.000 = Rp 225.000 ✅
Total: Rp 225.000 (updated)
```

### Scenario 2: Remove Item

```
PO-202601-002 (DRAFT)
  - Camera: 5 x Rp 500.000 = Rp 2.500.000
  - DVR: 1 x Rp 1.000.000 = Rp 1.000.000
Total: Rp 3.500.000

Delete "DVR" item

PO-202601-002 (DRAFT)
  - Camera: 5 x Rp 500.000 = Rp 2.500.000
Total: Rp 2.500.000 ✅
```

## 🧪 Testing

Check DRAFT POs:

```bash
npx tsx scripts/check-draft-po.ts
```

## 💡 Benefits

1. **Flexibility**: Edit quantity sebelum send ke supplier
2. **Accuracy**: Fix mistakes sebelum PO di-approve
3. **Control**: Adjust order based on latest needs
4. **Clean**: Remove unnecessary items

## 📝 Notes

- Once PO status changes to **PROGRESS** or **RECEIVED**, items cannot be edited
- For PO that already sent, create new PO for additional items
- Deleted items will return to pending list if linked to project

---

**Updated**: January 8, 2026
**Status**: ✅ Implemented & Tested
