export default defineEventHandler(async event => {
  const body = await readBody(event)

  if (!body.fromUnitId || !body.toUnitId || body.quantity === undefined) {
    throw createError({
      statusCode: 400,
      message: 'fromUnitId, toUnitId, and quantity are required',
    })
  }

  // Find direct conversion
  let conversion = await prisma.unitConversion.findUnique({
    where: {
      fromUnitId_toUnitId: {
        fromUnitId: body.fromUnitId,
        toUnitId: body.toUnitId,
      },
    },
    include: {
      fromUnit: true,
      toUnit: true,
    },
  })

  let factor: number
  let isReverse = false

  if (conversion) {
    factor = parseFloat(conversion.factor.toString())
  } else {
    // Try reverse conversion
    conversion = await prisma.unitConversion.findUnique({
      where: {
        fromUnitId_toUnitId: {
          fromUnitId: body.toUnitId,
          toUnitId: body.fromUnitId,
        },
      },
      include: {
        fromUnit: true,
        toUnit: true,
      },
    })

    if (conversion) {
      factor = 1 / parseFloat(conversion.factor.toString())
      isReverse = true
    } else {
      throw createError({
        statusCode: 404,
        message: 'No conversion rule found between these units',
      })
    }
  }

  const result = body.quantity * factor

  return {
    fromQuantity: body.quantity,
    fromUnit: isReverse ? conversion.toUnit : conversion.fromUnit,
    toQuantity: result,
    toUnit: isReverse ? conversion.fromUnit : conversion.toUnit,
    factor,
    isReverse,
  }
})
