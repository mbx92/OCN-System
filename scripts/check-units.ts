import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const units = await prisma.unit.findMany({
    select: {
      id: true,
      name: true,
      symbol: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  console.log('Available units in database:')
  console.table(units)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
