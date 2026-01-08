import { H3Event } from 'h3'

// Generate asset number: AST-YYYYMM-XXX
async function generateAssetNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `AST-${year}${month}`

  // Get last asset with same prefix
  const lastAsset = await prisma.asset.findFirst({
    where: {
      assetNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      assetNumber: 'desc',
    },
  })

  let sequence = 1
  if (lastAsset) {
    const lastSequence = parseInt(lastAsset.assetNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody(event)

  const {
    name,
    category,
    description,
    purchaseDate,
    purchasePrice,
    currentValue,
    serialNumber,
    location,
    condition,
    status,
    depreciationRate,
    notes,
    photo,
  } = body

  // Validate required fields
  if (!name || !category || !purchaseDate || !purchasePrice) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Validate condition
  const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']
  if (condition && !validConditions.includes(condition)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid condition value',
    })
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'DISPOSED']
  if (status && !validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid status value',
    })
  }

  try {
    // Generate asset number
    const assetNumber = await generateAssetNumber()

    // Create asset and cash transaction in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create asset
      const asset = await tx.asset.create({
        data: {
          assetNumber,
          name,
          category,
          description: description || null,
          purchaseDate: new Date(purchaseDate),
          purchasePrice: parseFloat(purchasePrice),
          currentValue: currentValue ? parseFloat(currentValue) : parseFloat(purchasePrice),
          serialNumber: serialNumber || null,
          location: location || null,
          condition: condition || 'GOOD',
          status: status || 'ACTIVE',
          depreciationRate: depreciationRate ? parseFloat(depreciationRate) : null,
          notes: notes || null,
          photo: photo || null,
        },
      })

      // Create cash transaction (EXPENSE) for asset purchase
      await tx.cashTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'ASSET',
          amount: parseFloat(purchasePrice),
          description: `Pembelian Asset: ${name}`,
          reference: assetNumber,
          referenceType: 'Asset',
          referenceId: asset.id,
          date: new Date(purchaseDate),
        },
      })

      return asset
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATE_ASSET',
        entity: 'Asset',
        entityId: result.id,
        metadata: {
          assetNumber,
          name,
          purchasePrice,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return result
  } catch (error: any) {
    console.error('Error creating asset:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create asset',
    })
  }
})
