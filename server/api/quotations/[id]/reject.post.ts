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

  if (quotation.status !== 'DRAFT' && quotation.status !== 'SENT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Penawaran sudah diproses (tidak bisa ditolak)',
    })
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      status: 'REJECTED',
    },
  })

  return updated
})
