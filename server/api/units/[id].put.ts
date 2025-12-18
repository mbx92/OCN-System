export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Unit ID is required',
    })
  }

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      name: body.name?.toLowerCase().trim(),
      symbol: body.symbol?.trim(),
      description: body.description,
      isBase: body.isBase,
    },
  })

  return unit
})
