import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  if (project.status !== 'ONGOING') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya proyek yang sedang dikerjakan yang bisa diselesaikan',
    })
  }

  // Get all project items with productId to process stock
  const projectItems = await prisma.projectItem.findMany({
    where: {
      projectId: id,
      productId: { not: null },
    },
    select: {
      id: true,
      productId: true,
      quantity: true,
      returnedQty: true,
      name: true,
    },
  })

  // Deduct stock: reduce quantity by actual used (qty - returned) and release all reserved
  for (const item of projectItems) {
    if (item.productId) {
      const actualUsed = item.quantity - (item.returnedQty || 0)

      // Get stock for linking movement
      const stock = await prisma.stock.findUnique({
        where: { productId: item.productId },
      })

      if (stock) {
        const newQuantity = stock.quantity - actualUsed
        const newReserved = stock.reserved - item.quantity
        const newAvailable = newQuantity - newReserved

        // Update stock with recalculated values
        await prisma.stock.update({
          where: { productId: item.productId },
          data: {
            quantity: newQuantity,
            reserved: newReserved,
            available: newAvailable,
          },
        })

        // Record DEDUCT movement
        if (actualUsed > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              stockId: stock.id,
              type: 'DEDUCT',
              quantity: -actualUsed,
              reference: id,
              notes: `Project completed: ${item.name} (${actualUsed} used)`,
            },
          })
        }

        // Record RETURN movement if any returned
        if (item.returnedQty && item.returnedQty > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              stockId: stock.id,
              type: 'RETURN',
              quantity: item.returnedQty,
              reference: id,
              notes: `Project completed: ${item.name} (${item.returnedQty} returned)`,
            },
          })
        }
      }
    }
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
    },
  })

  return updatedProject
})
