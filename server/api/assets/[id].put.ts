import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
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
      statusMessage: 'Asset ID is required',
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

  // Validate condition if provided
  if (condition) {
    const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN']
    if (!validConditions.includes(condition)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid condition value',
      })
    }
  }

  // Validate status if provided
  if (status) {
    const validStatuses = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'DISPOSED']
    if (!validStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status value',
      })
    }
  }

  try {
    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!existingAsset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset not found',
      })
    }

    // Update asset
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description: description || null }),
        ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
        ...(purchasePrice && { purchasePrice: parseFloat(purchasePrice) }),
        ...(currentValue !== undefined && {
          currentValue: currentValue ? parseFloat(currentValue) : null,
        }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber || null }),
        ...(location !== undefined && { location: location || null }),
        ...(condition && { condition }),
        ...(status && { status }),
        ...(depreciationRate !== undefined && {
          depreciationRate: depreciationRate ? parseFloat(depreciationRate) : null,
        }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(photo !== undefined && { photo: photo || null }),
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ASSET',
        entity: 'Asset',
        entityId: asset.id,
        metadata: {
          assetNumber: asset.assetNumber,
          name: asset.name,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return asset
  } catch (error: any) {
    console.error('Error updating asset:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update asset',
    })
  }
})
