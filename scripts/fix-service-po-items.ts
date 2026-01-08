/**
 * Script untuk membersihkan item jasa dari pending PO
 *
 * Jalankan dengan: npx ts-node scripts/fix-service-po-items.ts
 *
 * Script ini akan:
 * 1. Mencari semua product dengan isService = true
 * 2. Update semua projectItem yang terkait untuk set needsPo = false dan poStatus = 'NONE'
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Mencari produk jasa (isService = true)...')

  // Cari semua produk yang adalah jasa
  const serviceProducts = await prisma.product.findMany({
    where: { isService: true },
    select: { id: true, name: true, sku: true },
  })

  console.log(`📦 Ditemukan ${serviceProducts.length} produk jasa:`)
  serviceProducts.forEach(p => console.log(`   - ${p.sku}: ${p.name}`))

  if (serviceProducts.length === 0) {
    console.log('⚠️  Tidak ada produk dengan isService = true!')
    console.log('   Pastikan Anda sudah update flag isService untuk produk jasa di inventory.')
    return
  }

  const serviceProductIds = serviceProducts.map(p => p.id)

  // Cari project items dengan produk jasa yang masih needsPo = true
  const affectedItems = await prisma.projectItem.findMany({
    where: {
      productId: { in: serviceProductIds },
      OR: [{ needsPo: true }, { poStatus: 'PENDING' }],
    },
    include: {
      product: { select: { name: true, sku: true } },
      project: { select: { projectNumber: true, title: true } },
    },
  })

  console.log(`\n🔧 Ditemukan ${affectedItems.length} item jasa yang perlu dibersihkan:`)
  affectedItems.forEach(item => {
    console.log(`   - ${item.project?.projectNumber}: ${item.name} (${item.product?.sku})`)
    console.log(`     needsPo: ${item.needsPo}, poStatus: ${item.poStatus}`)
  })

  if (affectedItems.length === 0) {
    console.log('✅ Tidak ada item jasa yang perlu dibersihkan dari pending PO!')
    return
  }

  // Update items
  console.log('\n📝 Mengupdate items...')

  const result = await prisma.projectItem.updateMany({
    where: {
      productId: { in: serviceProductIds },
      OR: [{ needsPo: true }, { poStatus: 'PENDING' }],
    },
    data: {
      needsPo: false,
      poStatus: 'NONE',
    },
  })

  console.log(`✅ Berhasil update ${result.count} item!`)
  console.log('   Item jasa sudah dihapus dari pending PO.')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
