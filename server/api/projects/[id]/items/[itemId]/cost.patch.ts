export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Only ADMIN and OWNER can edit cost
  if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      message: 'Hanya Admin dan Owner yang dapat mengubah harga pokok',
    })
  }

  if (!projectId || !itemId) {
    throw createError({
      statusCode: 400,
      message: 'ID tidak valid',
    })
  }

  const body = await readBody(event)
  const { cost } = body

  if (typeof cost !== 'number' || cost < 0) {
    throw createError({
      statusCode: 400,
      message: 'Harga pokok harus berupa angka positif',
    })
  }

  try {
    // Get current item data
    const currentItem = await prisma.projectItem.findUnique({
      where: { id: itemId },
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            status: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!currentItem) {
      throw createError({
        statusCode: 404,
        message: 'Item tidak ditemukan',
      })
    }

    if (currentItem.projectId !== projectId) {
      throw createError({
        statusCode: 400,
        message: 'Item tidak sesuai dengan project',
      })
    }

    // Don't allow editing cost if project is already completed
    if (currentItem.project.status === 'COMPLETED') {
      throw createError({
        statusCode: 400,
        message: 'Tidak dapat mengubah harga pokok pada proyek yang sudah selesai',
      })
    }

    const oldCost = Number(currentItem.cost)
    const newCost = Number(cost)

    // Calculate new total cost (cost * quantity)
    const newTotalCost = newCost * currentItem.quantity

    // Update the cost and totalCost
    const updatedItem = await prisma.projectItem.update({
      where: { id: itemId },
      data: {
        cost: newCost,
        totalCost: newTotalCost,
      },
    })

    // Log the activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'PROJECT_ITEM',
        entityId: itemId,
        metadata: {
          projectId: currentItem.projectId,
          projectNumber: currentItem.project.projectNumber,
          itemName: currentItem.name,
          productName: currentItem.product?.name,
          oldCost,
          newCost,
          difference: newCost - oldCost,
          description: `Mengubah harga pokok "${currentItem.name}" dari Rp ${oldCost.toLocaleString()} menjadi Rp ${newCost.toLocaleString()}`,
        },
      },
    })

    return {
      success: true,
      data: updatedItem,
      message: 'Harga pokok berhasil diupdate',
    }
  } catch (error: any) {
    console.error('Error updating project item cost:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Gagal mengubah harga pokok',
    })
  }
})
