/**
 * Script untuk:
 * 1. Menampilkan semua produk dan statusnya
 * 2. Update produk jasa berdasarkan nama yang mengandung kata tertentu
 * 3. Membersihkan pending PO untuk produk jasa
 * 4. Reset stock reserved untuk produk jasa (karena tidak perlu stock)
 *
 * Jalankan dengan: npx ts-node scripts/fix-services-complete.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Kata kunci untuk mendeteksi jasa (tambahkan sesuai kebutuhan)
  const serviceKeywords = [
    'jasa',
    'service',
    'pasang',
    'setting',
    'konfigurasi',
    'instalasi',
    'maintenance',
  ]

  console.log('='.repeat(60))
  console.log('SCRIPT FIX PRODUK JASA')
  console.log('='.repeat(60))

  // 1. Tampilkan semua produk
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      isService: true,
      type: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log('\n📦 DAFTAR SEMUA PRODUK:')
  console.log('-'.repeat(60))
  allProducts.forEach(p => {
    const serviceFlag = p.isService ? '✅ JASA' : '📦 BARANG'
    console.log(`${serviceFlag} | ${p.sku} | ${p.name}`)
  })

  // 2. Deteksi produk yang mungkin jasa berdasarkan nama
  const potentialServices = allProducts.filter(
    p =>
      !p.isService &&
      serviceKeywords.some(keyword => p.name.toLowerCase().includes(keyword.toLowerCase()))
  )

  if (potentialServices.length > 0) {
    console.log('\n⚠️  PRODUK YANG MUNGKIN JASA (belum ditandai):')
    console.log('-'.repeat(60))
    potentialServices.forEach(p => {
      console.log(`   - ${p.sku}: ${p.name}`)
    })

    // Update semua produk yang terdeteksi sebagai jasa
    console.log('\n📝 Mengupdate produk-produk di atas menjadi isService = true...')

    const updateResult = await prisma.product.updateMany({
      where: {
        id: { in: potentialServices.map(p => p.id) },
      },
      data: {
        isService: true,
      },
    })

    console.log(`✅ Berhasil update ${updateResult.count} produk!`)
  }

  // 3. Sekarang cari semua produk jasa (termasuk yang baru diupdate)
  const serviceProducts = await prisma.product.findMany({
    where: { isService: true },
    select: { id: true, name: true, sku: true },
  })

  console.log(`\n📋 TOTAL PRODUK JASA: ${serviceProducts.length}`)
  serviceProducts.forEach(p => console.log(`   - ${p.sku}: ${p.name}`))

  if (serviceProducts.length === 0) {
    console.log('\n⚠️  Tidak ada produk jasa ditemukan!')
    console.log('   Silakan update manual melalui UI atau database.')
    return
  }

  const serviceProductIds = serviceProducts.map(p => p.id)

  // 4. Bersihkan pending PO untuk produk jasa
  console.log('\n🔧 Membersihkan pending PO untuk produk jasa...')

  const poItemsResult = await prisma.projectItem.updateMany({
    where: {
      productId: { in: serviceProductIds },
      OR: [{ needsPo: true }, { poStatus: 'PENDING' }],
    },
    data: {
      needsPo: false,
      poStatus: 'NONE',
    },
  })

  console.log(`✅ Berhasil bersihkan ${poItemsResult.count} item dari pending PO`)

  // 5. Reset stock untuk produk jasa (seharusnya tidak punya stock)
  console.log('\n🔧 Reset stock untuk produk jasa...')

  const stockResult = await prisma.stock.updateMany({
    where: {
      productId: { in: serviceProductIds },
    },
    data: {
      quantity: 0,
      reserved: 0,
      available: 0,
    },
  })

  console.log(`✅ Berhasil reset ${stockResult.count} stock entry`)

  console.log('\n' + '='.repeat(60))
  console.log('SELESAI! Silakan refresh halaman Purchase Orders.')
  console.log('='.repeat(60))
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
