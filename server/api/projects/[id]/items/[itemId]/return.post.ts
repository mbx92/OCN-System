import { z } from 'zod'

const returnSchema = z.object({
  returnQty: z.number().min(1, 'Qty minimal 1'),
  notes: z.string().optional(),
})

export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')
  const body = await readBody(event)

  if (!projectId || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek atau item tidak ditemukan',
    })
  }

  const result = returnSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { returnQty, notes } = result.data

  // Get the item
  const item = await prisma.projectItem.findUnique({
    where: { id: itemId },
  })

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item tidak ditemukan',
    })
  }

  if (item.projectId !== projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item tidak termasuk dalam proyek ini',
    })
  }

  // Check if return qty is valid
  const maxReturnable = item.quantity - (item.returnedQty || 0)
  if (returnQty > maxReturnable) {
    throw createError({
      statusCode: 400,
      statusMessage: `Qty return maksimal ${maxReturnable}`,
    })
  }

  // Calculate new totals based on actual used qty
  const newReturnedQty = (item.returnedQty || 0) + returnQty
  const actualUsedQty = item.quantity - newReturnedQty
  const newTotalPrice = actualUsedQty * Number(item.price)
  const newTotalCost = actualUsedQty * Number(item.cost)

  // Update item returnedQty and recalculate totals
  const updatedItem = await prisma.projectItem.update({
    where: { id: itemId },
    data: {
      returnedQty: newReturnedQty,
      totalPrice: newTotalPrice,
      totalCost: newTotalCost,
    },
  })

  // Note: We DON'T release reserved stock here.
  // Reserved will be released when project is COMPLETED.
  // At completion: deduct (qty - returnedQty) from quantity, release ALL reserved.
  //
  // If we need to track movements for return, we can add it here:
  if (item.productId) {
    // Get project for reference
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectNumber: true },
    })

    const stock = await prisma.stock.findUnique({
      where: { productId: item.productId },
    })

    if (stock) {
      // Just record the movement for tracking, don't change stock values
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          stockId: stock.id,
          type: 'RETURN_PENDING',
          quantity: returnQty,
          reference: project?.projectNumber || projectId,
          notes: notes || `Return pending: ${item.name}`,
        },
      })
    }
  }

  return updatedItem
})
