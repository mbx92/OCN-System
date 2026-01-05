export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Product ID required',
    })
  }

  const stock = await prisma.stock.findUnique({
    where: { productId: id },
  })

  if (!stock) {
    // Return default if no stock record
    return {
      quantity: 0,
      available: 0,
      reserved: 0,
    }
  }

  return stock
})
