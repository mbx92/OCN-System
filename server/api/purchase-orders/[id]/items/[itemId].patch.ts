import { z } from 'zod'

const updateItemSchema = z.object({
  quantity: z.number().min(1, 'Quantity minimal 1').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional(),
})

export default defineEventHandler(async event => {
  const poId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')
  const body = await readBody(event)

  if (!poId || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const result = updateItemSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // At least one field must be provided
  if (!result.data.quantity && result.data.price === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Minimal satu field (quantity atau price) harus diisi',
    })
  }

  // Get PO to check status
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { status: true },
  })

  if (!po) {
    throw createError({
      statusCode: 404,
      statusMessage: 'PO tidak ditemukan',
    })
  }

  // Only allow editing DRAFT PO
  if (po.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya PO dengan status DRAFT yang bisa diedit',
    })
  }

  // Get current item data
  const item = await prisma.purchaseOrderItem.findUnique({
    where: { id: itemId },
    select: { 
      price: true, 
      quantity: true,
      total: true,
      purchaseOrderId: true 
    },
  })

  if (!item || item.purchaseOrderId !== poId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item tidak ditemukan',
    })
  }

  // Calculate new values
  const newQuantity = result.data.quantity ?? item.quantity
  const newPrice = result.data.price ?? Number(item.price)
  const newTotal = newQuantity * newPrice

  // Update item in transaction
  await prisma.$transaction(async tx => {
    // Update item
    await tx.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        price: newPrice,
        total: newTotal,
      },
    })

    // Recalculate PO subtotal and total
    const allItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
      select: { id: true, total: true },
    })

    const subtotal = allItems.reduce((sum, i) => {
      const itemTotal = i.id === itemId ? newTotal : Number(i.total)
      return sum + itemTotal
    }, 0)

    // Get current shipping and other costs
    const currentPo = await tx.purchaseOrder.findUnique({
      where: { id: poId },
      select: { shippingCost: true, otherCosts: true },
    })

    const totalAmount = subtotal + Number(currentPo!.shippingCost) + Number(currentPo!.otherCosts)

    // Update PO totals
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        subtotal,
        totalAmount,
      },
    })
  })

  return { success: true }
})
