export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stock: true,
      suppliers: {
        include: {
          supplier: true,
        },
      },
    },
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Produk tidak ditemukan',
    })
  }

  // Transform stock object to number
  return {
    ...product,
    stock: product.stock?.available || 0,
  }
})
