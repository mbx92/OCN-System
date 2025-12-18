export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10

  const [stocks, total] = await Promise.all([
    prisma.stock.findMany({
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unit: true,
            minStock: true,
            sellingPrice: true,
            purchasePrice: true,
          },
        },
      },
      orderBy: {
        available: 'asc', // Show lowest stock first
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stock.count(),
  ])

  return {
    data: stocks,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
