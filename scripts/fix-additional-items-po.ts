import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Fixing ADDITIONAL items to add needsPo and poStatus flags...\n')

  // Get all ADDITIONAL items that don't have needsPo/poStatus set
  const additionalItems = await prisma.projectItem.findMany({
    where: {
      type: 'ADDITIONAL',
      productId: { not: null }, // Only for items linked to products
    },
    include: {
      product: {
        include: {
          stock: true,
        },
      },
      project: {
        select: {
          projectNumber: true,
          status: true,
        },
      },
    },
  })

  console.log(`📦 Found ${additionalItems.length} ADDITIONAL items with products\n`)

  let fixed = 0
  let skipped = 0

  for (const item of additionalItems) {
    // Skip if product is a service
    if (item.product?.isService) {
      console.log(`⏩ Skipping ${item.name} (${item.project.projectNumber}) - Service item`)
      skipped++
      continue
    }

    const availableStock = item.product?.stock?.available || 0
    const needsPo = availableStock < item.quantity
    const poStatus = needsPo ? 'PENDING' : 'NONE'

    // Check if already has correct values
    if (item.needsPo === needsPo && item.poStatus === poStatus) {
      console.log(`✅ ${item.name} (${item.project.projectNumber}) - Already correct`)
      skipped++
      continue
    }

    // Update item
    await prisma.projectItem.update({
      where: { id: item.id },
      data: {
        needsPo,
        poStatus,
      },
    })

    console.log(
      `🔧 Fixed ${item.name} (${item.project.projectNumber}) - needsPo: ${needsPo}, poStatus: ${poStatus}, available: ${availableStock}/${item.quantity}`
    )
    fixed++
  }

  console.log(`\n✅ Summary:`)
  console.log(`   - Fixed: ${fixed} items`)
  console.log(`   - Skipped: ${skipped} items`)
  console.log(`\n💡 Now ADDITIONAL items will appear in PO pending list if stock is insufficient!`)
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
