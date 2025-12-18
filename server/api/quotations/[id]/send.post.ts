export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID penawaran tidak ditemukan',
    })
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id },
  })

  if (!quotation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Penawaran tidak ditemukan',
    })
  }

  if (quotation.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya penawaran draft yang bisa dikirim',
    })
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      status: 'SENT',
    },
  })

  return updated
})
