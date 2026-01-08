import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      purchaseUnit: true,
    },
    take: 10,
  })

  console.log('Sample products with units:')
  console.table(products)

  const productsWithoutUnit = await prisma.product.count({
    where: {
      unit: null,
    },
  })

  const totalProducts = await prisma.product.count()

  console.log(`\nProducts without unit: ${productsWithoutUnit} of ${totalProducts}`)
  console.log(`Products with unit: ${totalProducts - productsWithoutUnit} of ${totalProducts}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
