import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Items with PENDING PO Status:\n')

  const items = await prisma.projectItem.findMany({
    where: {
      poStatus: 'PENDING',
    },
    include: {
      project: {
        select: {
          projectNumber: true,
          status: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  })

  if (items.length === 0) {
    console.log('❌ No items found with PENDING PO status\n')
  } else {
    console.table(
      items.map(i => ({
        Project: i.project.projectNumber,
        Status: i.project.status,
        Item: i.name,
        Type: i.type,
        Qty: i.quantity,
        Unit: i.unit,
        'PO Status': i.poStatus,
        'Needs PO': i.needsPo ? 'YES' : 'NO',
      }))
    )
    console.log(`\n✅ Total: ${items.length} items pending for PO`)
    console.log(
      `💡 These items will appear in Purchase Orders page → Create PO → Pending Items list`
    )
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
