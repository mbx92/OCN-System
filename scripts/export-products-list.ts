import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportProductsList() {
  console.log('📦 EXPORT DAFTAR PRODUK\n')

  try {
    const products = await prisma.product.findMany({
      include: {
        stock: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    console.log(`✅ Ditemukan ${products.length} produk\n`)

    // Prepare data for Excel
    const productsData = products.map(p => ({
      'Product ID': p.id,
      SKU: p.sku,
      'Nama Produk': p.name,
      Kategori: p.category || '-',
      Tipe: p.type === 'PRODUCT' ? 'Produk' : 'Jasa',
      Satuan: p.unit || '-',
      'Harga Jual': Number(p.sellingPrice),
      HPP: Number(p.purchasePrice),
      Stok: p.stock?.available || 0,
    }))

    // Create Excel workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(productsData)

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Product ID
      { wch: 15 }, // SKU
      { wch: 40 }, // Nama Produk
      { wch: 20 }, // Kategori
      { wch: 10 }, // Tipe
      { wch: 10 }, // Satuan
      { wch: 15 }, // Harga Jual
      { wch: 15 }, // HPP
      { wch: 10 }, // Stok
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Products')

    // Save to file
    const filePath = path.join(process.cwd(), 'daftar-produk.xlsx')
    XLSX.writeFile(wb, filePath)

    console.log(`✅ File berhasil dibuat: ${filePath}\n`)
    console.log('📋 PREVIEW PRODUK:\n')
    console.log('='.repeat(100))
    console.log('ID'.padEnd(35), 'SKU'.padEnd(15), 'Nama Produk'.padEnd(35), 'Kategori')
    console.log('='.repeat(100))

    products.slice(0, 20).forEach(p => {
      console.log(
        p.id.padEnd(35),
        (p.sku || '-').padEnd(15),
        p.name.substring(0, 33).padEnd(35),
        p.category || '-'
      )
    })

    if (products.length > 20) {
      console.log(`... dan ${products.length - 20} produk lainnya`)
    }

    console.log('='.repeat(100))
    console.log('\n💡 CARA PAKAI:')
    console.log('  1. Buka file daftar-produk.xlsx')
    console.log('  2. Copy Product ID yang diinginkan')
    console.log('  3. Paste ke kolom "Product ID" di sheet Items')
    console.log('\n📝 CATATAN:')
    console.log('  - Product ID OPSIONAL - hanya perlu diisi jika ingin link ke master produk')
    console.log('  - Jika tidak pakai Product ID, item akan tetap tercatat tapi tidak link ke stok')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

exportProductsList()
