export default defineEventHandler(async event => {
  const body = await readBody(event)

  if (!body.fromUnitId || !body.toUnitId || !body.factor) {
    throw createError({
      statusCode: 400,
      message: 'fromUnitId, toUnitId, and factor are required',
    })
  }

  if (body.fromUnitId === body.toUnitId) {
    throw createError({
      statusCode: 400,
      message: 'Cannot convert unit to itself',
    })
  }

  const conversion = await prisma.unitConversion.create({
    data: {
      fromUnitId: body.fromUnitId,
      toUnitId: body.toUnitId,
      factor: body.factor,
      notes: body.notes || null,
    },
    include: {
      fromUnit: true,
      toUnit: true,
    },
  })

  return conversion
})
