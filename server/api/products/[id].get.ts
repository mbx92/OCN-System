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

  return product
})
