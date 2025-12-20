export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      },
    },
  })

  if (!payment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pembayaran tidak ditemukan',
    })
  }

  return payment
})
