export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')

  // Get current user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (!projectId || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  // Check if item exists and belongs to this project
  const existingItem = await prisma.projectItem.findFirst({
    where: {
      id: itemId,
      projectId,
    },
    include: {
      project: {
        select: {
          status: true,
          projectNumber: true,
        },
      },
    },
  })

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item tidak ditemukan',
    })
  }

  // Check project status - only allow deletion for QUOTATION and APPROVED
  if (!['QUOTATION', 'APPROVED'].includes(existingItem.project.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak dapat menghapus item pada proyek yang sudah berjalan',
    })
  }

  // If item has a product, release the reserved stock
  if (existingItem.productId) {
    const product = await prisma.product.findUnique({
      where: { id: existingItem.productId },
      include: { stock: true },
    })

    if (product && product.stock) {
      // Release reserved stock
      await prisma.productStock.update({
        where: { productId: existingItem.productId },
        data: {
          reserved: {
            decrement: existingItem.quantity - (existingItem.returnedQty || 0),
          },
        },
      })
    }
  }

  // Delete the item
  await prisma.projectItem.delete({
    where: { id: itemId },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'DELETE_PROJECT_ITEM',
      entity: 'ProjectItem',
      entityId: itemId,
      metadata: {
        projectId,
        projectNumber: existingItem.project.projectNumber,
        itemName: existingItem.name,
        quantity: existingItem.quantity,
      },
      ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
    },
  })

  return {
    success: true,
    message: 'Item berhasil dihapus',
  }
})
