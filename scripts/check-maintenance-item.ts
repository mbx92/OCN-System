import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMaintenanceItem() {
  try {
    const items = await prisma.projectItem.findMany({
      where: {
        project: {
          projectNumber: 'MNT-2601-002',
        },
        totalCost: { gt: 0 },
      },
    })

    console.log('📋 Items dari MNT-2601-002:\n')
    items.forEach(item => {
      console.log(JSON.stringify(item, null, 2))
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkMaintenanceItem()
