import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Keywords that indicate a product is a service
const serviceKeywords = [
  'jasa',
  'service',
  'pasang',
  'instalasi',
  'install',
  'setting',
  'konfigurasi',
  'maintenance',
  'perbaikan',
  'troubleshoot',
  'krimping',
  'crimping',
  'support',
  'konsultasi',
  'survey',
]

// Mapping for suggested units based on product name
function getSuggestedUnit(productName: string): string {
  const nameLower = productName.toLowerCase()

  // Per-point services (installation)
  if (
    nameLower.includes('pasang') ||
    nameLower.includes('instalasi') ||
    nameLower.includes('install')
  ) {
    return 'Titik'
  }

  // Per-unit services (setting, config)
  if (nameLower.includes('setting') || nameLower.includes('konfigurasi')) {
    return 'Unit'
  }

  // Crimping services
  if (nameLower.includes('krimping') || nameLower.includes('crimping')) {
    return 'Titik'
  }

  // Support/troubleshooting
  if (nameLower.includes('troubleshoot') || nameLower.includes('support')) {
    return 'Jam'
  }

  // Maintenance
  if (nameLower.includes('maintenance') || nameLower.includes('perbaikan')) {
    return 'Pekerjaan'
  }

  // Default for other services
  return 'Pekerjaan'
}

async function main() {
  console.log('🔍 Mencari produk yang mungkin adalah jasa...\n')

  // Find products that might be services based on keywords
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      isService: true,
    },
  })

  const servicesToUpdate: Array<{
    id: string
    sku: string
    name: string
    currentUnit: string | null
    suggestedUnit: string
    isService: boolean
  }> = []

  for (const product of products) {
    const nameLower = product.name.toLowerCase()
    const isLikelyService = serviceKeywords.some(keyword => nameLower.includes(keyword))

    if (isLikelyService) {
      servicesToUpdate.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        currentUnit: product.unit,
        suggestedUnit: getSuggestedUnit(product.name),
        isService: product.isService,
      })
    }
  }

  console.log(`📋 Ditemukan ${servicesToUpdate.length} produk jasa:\n`)

  for (const svc of servicesToUpdate) {
    console.log(`   - ${svc.sku}: ${svc.name}`)
    console.log(`     Unit: "${svc.currentUnit}" → "${svc.suggestedUnit}"`)
    console.log(`     isService: ${svc.isService ? '✓' : '✗ (akan diupdate)'}`)
    console.log('')
  }

  // Update all service products
  console.log('\n🔄 Mengupdate produk jasa...\n')

  let updatedCount = 0
  for (const svc of servicesToUpdate) {
    await prisma.product.update({
      where: { id: svc.id },
      data: {
        isService: true,
        unit: svc.suggestedUnit,
      },
    })
    console.log(`   ✓ Updated: ${svc.sku} - ${svc.name}`)
    updatedCount++
  }

  console.log(`\n✅ Selesai! ${updatedCount} produk jasa telah diupdate.`)
  console.log(`   - isService: true`)
  console.log(`   - Unit: sesuai tipe jasa`)

  // Also reset stock for service products (services shouldn't have stock)
  console.log('\n🧹 Mereset stok produk jasa (jasa tidak memiliki stok fisik)...')

  const serviceIds = servicesToUpdate.map(s => s.id)
  const stockResult = await prisma.stock.updateMany({
    where: { productId: { in: serviceIds } },
    data: {
      quantity: 0,
      reserved: 0,
      available: 0,
    },
  })

  console.log(`   ✓ ${stockResult.count} record stok direset ke 0`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
