import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Service units to add
const serviceUnits = [
  {
    name: 'titik',
    symbol: 'Titik',
    description: 'Satuan untuk jasa pemasangan per titik (CCTV, LAN, dll)',
  },
  { name: 'pekerjaan', symbol: 'Pekerjaan', description: 'Satuan untuk jasa paket/borongan' },
  { name: 'jam', symbol: 'Jam', description: 'Satuan untuk jasa per jam (troubleshoot, support)' },
  { name: 'hari', symbol: 'Hari', description: 'Satuan untuk jasa per hari' },
  { name: 'ls', symbol: 'Ls', description: 'Lumpsum - satuan untuk jasa borongan' },
]

async function main() {
  console.log('🔍 Mengecek satuan yang sudah ada...\n')

  const existingUnits = await prisma.unit.findMany({
    select: { name: true, symbol: true },
  })

  console.log('📋 Satuan yang sudah ada:')
  for (const unit of existingUnits) {
    console.log(`   - ${unit.name} (${unit.symbol})`)
  }

  console.log('\n🔄 Menambahkan satuan jasa yang belum ada...\n')

  let addedCount = 0
  for (const serviceUnit of serviceUnits) {
    const exists = existingUnits.some(u => u.name.toLowerCase() === serviceUnit.name.toLowerCase())

    if (!exists) {
      await prisma.unit.create({
        data: serviceUnit,
      })
      console.log(`   ✓ Ditambahkan: ${serviceUnit.name} (${serviceUnit.symbol})`)
      addedCount++
    } else {
      console.log(`   ⏭ Sudah ada: ${serviceUnit.name}`)
    }
  }

  console.log(`\n✅ Selesai! ${addedCount} satuan baru ditambahkan.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
