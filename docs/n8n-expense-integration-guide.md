# n8n Expense Tracker Integration Guide

## OCN System + Telegram + Gemini Vision

Panduan lengkap untuk mengintegrasikan sistem expense tracking dengan n8n, Telegram Bot, dan Gemini AI untuk OCR nota otomatis.

---

## 📋 Daftar Isi

1. [Prerequisites](#prerequisites)
2. [Setup Credentials](#setup-credentials)
3. [Import Workflow](#import-workflow)
4. [Konfigurasi](#konfigurasi)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Yang Dibutuhkan:

- ✅ **n8n** terinstall dan berjalan
- ✅ **Telegram Bot Token** (dari @BotFather)
- ✅ **Gemini API Key** (dari Google AI Studio)
- ✅ **OCN System** berjalan dan accessible dari n8n

### Mendapatkan Gemini API Key:

1. Buka [Google AI Studio](https://aistudio.google.com/)
2. Klik **Get API Key**
3. Buat project baru atau pilih existing
4. Copy API Key yang dihasilkan

---

## Setup Credentials

### 1. Telegram API Credential

Di n8n, buat credential baru:

- **Type:** Telegram API
- **Access Token:** Token dari @BotFather

### 2. Gemini API Key Credential

Buat credential tipe **HTTP Query Auth**:

- **Name:** `key`
- **Value:** API Key Gemini Anda

### 3. OCN System API Credential

Buat credential tipe **HTTP Header Auth**:

- **Name:** `Authorization`
- **Value:** `Bearer YOUR_API_TOKEN`

> **Note:** Anda perlu membuat API token di OCN System atau menggunakan session cookie.

---

## Import Workflow

1. Buka n8n
2. Klik **Import from File**
3. Pilih file `n8n-expense-workflow.json`
4. Update semua placeholder credential ID

---

## Konfigurasi

### URL yang Perlu Diubah:

```
YOUR-OCN-SYSTEM-URL → URL sistem OCN Anda (contoh: erp.ocnetworks.web.id)
```

### Credential ID yang Perlu Diubah:

Di setiap node, ganti:

```
YOUR_TELEGRAM_CREDENTIAL_ID → ID credential Telegram
YOUR_GEMINI_API_KEY_CREDENTIAL_ID → ID credential Gemini
YOUR_OCN_API_CREDENTIAL_ID → ID credential OCN System
```

---

## Flow Diagram

```
┌─────────────────┐
│   User kirim    │
│   foto nota     │
│   via Telegram  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Telegram       │
│  Trigger        │
└────────┬────────┘
         ↓
┌─────────────────┐  No   ┌─────────────────┐
│  Ada Foto?      │──────→│ Kirim instruksi │
└────────┬────────┘       └─────────────────┘
         │ Yes
         ↓
┌─────────────────┐
│ Download Foto   │
│ → Convert Base64│
└────────┬────────┘
         ↓
┌─────────────────┐
│  Gemini Vision  │
│  OCR + Parse    │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Berhasil Parse? │
└────────┬────────┘
    Yes  │  No
    ↓    └──→ Kirim Error
┌─────────────────┐
│  POST ke OCN    │
│  /api/expenses  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Kirim Konfirmasi│
│ ke User         │
└─────────────────┘
```

---

## Kategori Expense yang Didukung

| Kategori dari AI | Type        | Category di System        |
| ---------------- | ----------- | ------------------------- |
| Makan            | OPERATIONAL | Makan & Minum             |
| Transport        | OPERATIONAL | Transport                 |
| ATK              | OPERATIONAL | Alat Tulis & Kantor       |
| Internet         | OPERATIONAL | Internet & Telekomunikasi |
| Listrik          | OPERATIONAL | Listrik                   |
| Sewa             | OPERATIONAL | Sewa                      |
| Lainnya          | OPERATIONAL | Lainnya                   |

---

## Testing

1. **Aktifkan workflow** di n8n
2. **Kirim pesan teks** ke bot → Harus muncul instruksi
3. **Kirim foto nota** → Bot akan memproses dan menyimpan

### Contoh Response Sukses:

```
✅ Pengeluaran Berhasil Dicatat!

📝 Deskripsi: Makan siang - Warteg Bahari
💰 Jumlah: Rp 25,000
📂 Kategori: Makan & Minum
📅 Tanggal: 2026-01-15
🏪 Merchant: Warteg Bahari

Data telah tersimpan di sistem OCN.
```

---

## Troubleshooting

### ❌ Gemini tidak bisa membaca nota

**Kemungkinan penyebab:**

- Foto terlalu buram
- Nota terlipat atau terhalang
- Resolusi terlalu rendah

**Solusi:**

- Minta user kirim foto yang lebih jelas
- Pastikan pencahayaan cukup

### ❌ Error "Unauthorized" saat POST ke OCN

**Kemungkinan penyebab:**

- API token expired
- Credential tidak valid

**Solusi:**

- Update token di credential
- Pastikan user memiliki permission untuk create expense

### ❌ Workflow tidak trigger

**Kemungkinan penyebab:**

- Webhook belum di-register

**Solusi:**

- Klik "Listen for Test Event" di Telegram Trigger
- Kirim pesan ke bot
- Setelah berhasil, activate workflow

---

## Fitur Lanjutan (Opsional)

### 1. Tambah Konfirmasi Sebelum Simpan

Tambahkan node untuk menampilkan preview data dan minta konfirmasi user sebelum menyimpan.

### 2. Simpan Foto ke Storage

Tambahkan node untuk upload foto ke cloud storage (S3, Cloudinary) dan simpan URL di field `receipt`.

### 3. Assign ke Project

Modifikasi prompt Gemini untuk mendeteksi nomor project jika ada di nota.

---

## Support

Jika ada pertanyaan atau masalah, hubungi tim OCN Networks.
