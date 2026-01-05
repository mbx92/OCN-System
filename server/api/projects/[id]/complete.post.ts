import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const user = event.context.user // Get current user from session

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
        const newQuantity = Math.max(0, stock.quantity - actualUsed)
        // Ensure reserved never goes negative
        const releasedReserved = Math.min(stock.reserved, item.quantity)
        const newReserved = Math.max(0, stock.reserved - item.quantity)
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

        // Record RELEASE movement (reserve freed)
        if (releasedReserved > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              stockId: stock.id,
              type: 'RELEASE',
              quantity: -releasedReserved,
              reference: project.projectNumber,
              notes: `Reserve released: ${item.name}`,
            },
          })
        }

        // Record DEDUCT movement
        if (actualUsed > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              stockId: stock.id,
              type: 'DEDUCT',
              quantity: -actualUsed,
              reference: project.projectNumber,
              notes: `Project completed: ${item.name}`,
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
              reference: project.projectNumber,
              notes: `Returned: ${item.name}`,
            },
          })
        }
      }
    }
  }

  // Sync ProjectExpenses to main Expense table
  const projectExpenses = await prisma.projectExpense.findMany({
    where: { projectId: id },
  })

  // Create Expense entries for each ProjectExpense (type: PROJECT)
  for (const expense of projectExpenses) {
    // Check if already synced (by checking description + projectId + date)
    const existing = await prisma.expense.findFirst({
      where: {
        projectId: id,
        type: 'PROJECT',
        description: expense.description,
        date: expense.date,
      },
    })

    if (!existing) {
      await prisma.expense.create({
        data: {
          type: 'PROJECT',
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          receipt: expense.receipt,
          date: expense.date,
          projectId: id,
          createdBy: user?.id || project.customerId, // Use logged-in user, fallback to customerId
        },
      })
    }
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
    },
    include: {
      customer: true,
    },
  })

  // Send Telegram notification with PDFs
  const { notifyProjectCompleted } = await import('../../../utils/telegram')
  notifyProjectCompleted({
    projectNumber: updatedProject.projectNumber,
    title: updatedProject.title,
    customerName: updatedProject.customer.name,
    projectId: updatedProject.id,
  }).catch(err => {
    console.error('Failed to send Telegram notification:', err)
  })

  return updatedProject
})
