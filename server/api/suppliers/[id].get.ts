export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID supplier tidak valid',
    })
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
      _count: {
        select: {
          purchaseOrders: true,
        },
      },
    },
  })

  if (!supplier) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Supplier tidak ditemukan',
    })
  }

  return supplier
})
