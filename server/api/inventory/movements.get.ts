export default defineEventHandler(async event => {
  const query = getQuery(event)
  const productId = query.productId as string
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Product ID is required',
    })
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({
      where: { productId },
    }),
  ])

  return {
    data: movements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
