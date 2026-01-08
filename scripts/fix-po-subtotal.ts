import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing PO subtotals...\n')

  // Get all POs
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      items: true,
    },
  })

  console.log(`Found ${pos.length} POs\n`)

  for (const po of pos) {
    // Calculate subtotal from items
    const subtotal = po.items.reduce((sum, item) => sum + Number(item.total), 0)

    // Calculate correct total
    const correctTotal = subtotal + Number(po.shippingCost || 0) + Number(po.otherCosts || 0)

    console.log(`PO: ${po.poNumber}`)
    console.log(`  Current subtotal: ${po.subtotal}`)
    console.log(`  Calculated subtotal: ${subtotal}`)
    console.log(`  Current total: ${po.totalAmount}`)
    console.log(`  Correct total: ${correctTotal}`)

    if (Number(po.subtotal) !== subtotal || Number(po.totalAmount) !== correctTotal) {
      console.log(`  ❌ FIXING...`)

      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: {
          subtotal: subtotal,
          totalAmount: correctTotal,
        },
      })

      console.log(`  ✅ Fixed!`)
    } else {
      console.log(`  ✅ OK`)
    }
    console.log('')
  }

  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
