export default defineEventHandler(async event => {
  const body = await readBody(event)

  if (!body.name || !body.symbol) {
    throw createError({
      statusCode: 400,
      message: 'Name and symbol are required',
    })
  }

  const unit = await prisma.unit.create({
    data: {
      name: body.name.toLowerCase().trim(),
      symbol: body.symbol.trim(),
      description: body.description || null,
      isBase: body.isBase || false,
    },
  })

  return unit
})
