import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping kategori yang akan di-merge (dari -> ke)
const categoryMergeMap: Record<string, string> = {
  // Case duplicates
  SWITCH: 'Switch',
  KABEL: 'Kabel',
  MONITOR: 'Monitor',
  PRINTER: 'Printer',

  // Other similar categories yang mungkin perlu di-merge
  HDD: 'Harddisk', // HDD dan Harddisk sama
  'INPUT DEVICE': 'Input Devices',
  MINIPC: 'Mini PC',
  SERVICE: 'Jasa', // Service dan Jasa sama
}

async function main() {
  console.log('=== Fix Duplicate Product Categories ===\n')

  // Dry run first - show what will be changed
  console.log('Preview changes:')
  console.log('-'.repeat(60))

  let totalToUpdate = 0

  for (const [oldCategory, newCategory] of Object.entries(categoryMergeMap)) {
    const count = await prisma.product.count({
      where: { category: oldCategory },
    })

    if (count > 0) {
      console.log(`"${oldCategory}" -> "${newCategory}" (${count} products)`)
      totalToUpdate += count
    }
  }

  if (totalToUpdate === 0) {
    console.log('\nNo products need to be updated.')
    return
  }

  console.log('-'.repeat(60))
  console.log(`Total: ${totalToUpdate} products will be updated\n`)

  // Ask for confirmation
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--execute')

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes made')
    console.log('   Run with --execute flag to apply changes:')
    console.log('   npx tsx scripts/fix-duplicate-categories.ts --execute')
    return
  }

  // Execute updates
  console.log('Executing updates...\n')

  for (const [oldCategory, newCategory] of Object.entries(categoryMergeMap)) {
    const result = await prisma.product.updateMany({
      where: { category: oldCategory },
      data: { category: newCategory },
    })

    if (result.count > 0) {
      console.log(`✅ Updated ${result.count} products: "${oldCategory}" -> "${newCategory}"`)
    }
  }

  console.log('\n=== Done! ===')

  // Show final category list
  console.log('\nFinal category list:')
  console.log('-'.repeat(60))

  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  })

  categories.forEach(c => {
    console.log(`${c.category}: ${c._count.category} products`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
