import { z } from 'zod'

const cancelSchema = z.object({
  reason: z.string().min(1, 'Alasan pembatalan wajib diisi'),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const result = cancelSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      items: {
        where: { productId: { not: null } },
      },
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  // Only allow cancellation for certain statuses
  const allowedStatuses = ['QUOTATION', 'APPROVED', 'ONGOING']
  if (!allowedStatuses.includes(project.status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Proyek dengan status ${project.status} tidak dapat dibatalkan`,
    })
  }

  // Release reserved stock for items with productId
  for (const item of project.items) {
    if (item.productId) {
      const stock = await prisma.stock.findUnique({
        where: { productId: item.productId },
      })

      if (stock) {
        const releaseQty = item.quantity - (item.returnedQty || 0)
        const newReserved = Math.max(0, stock.reserved - releaseQty)
        const newAvailable = stock.quantity - newReserved

        await prisma.stock.update({
          where: { productId: item.productId },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        })

        // Record stock movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            stockId: stock.id,
            type: 'RELEASE',
            quantity: releaseQty,
            reference: project.projectNumber,
            notes: `Cancelled: ${item.name} - ${result.data.reason}`,
          },
        })
      }
    }
  }

  // Update project status
  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      description: project.description
        ? `${project.description}\n\n[DIBATALKAN] ${result.data.reason}`
        : `[DIBATALKAN] ${result.data.reason}`,
    },
  })

  return updated
})
