export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
    },
  })

  if (!quotation) {
    throw createError({
      statusCode: 404,
      message: 'Quotation not found',
    })
  }

  return quotation
})
