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

    // Delete asset
    await prisma.asset.delete({
      where: { id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'DELETE_ASSET',
        entity: 'Asset',
        entityId: id,
        metadata: {
          assetNumber: existingAsset.assetNumber,
          name: existingAsset.name,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return {
      success: true,
      message: 'Asset deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting asset:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete asset',
    })
  }
})
