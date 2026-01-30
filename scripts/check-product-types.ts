import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Group by type
  const countsByType = await prisma.product.groupBy({
    by: ['type'],
    _count: true,
  })
  console.log('Product counts by type:')
  console.log(countsByType)

  // Group by category
  const countsByCategory = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
  })
  console.log('\nProduct counts by category:')
  console.log(countsByCategory)

  // Check products with Jasa category
  const jasaProducts = await prisma.product.findMany({
    where: { category: { contains: 'Jasa', mode: 'insensitive' } },
    take: 5,
    select: { id: true, name: true, type: true, category: true },
  })
  console.log('\nProducts with Jasa category:')
  console.log(jasaProducts)

  const total = await prisma.product.count()
  console.log('\nTotal products:', total)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
