export default defineEventHandler(async event => {
  const poId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')

  if (!poId || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  // Get PO to check status and item count
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: {
      status: true,
      items: {
        select: { id: true },
      },
    },
  })

  if (!po) {
    throw createError({
      statusCode: 404,
      statusMessage: 'PO tidak ditemukan',
    })
  }

  // Only allow deleting from DRAFT PO
  if (po.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya PO dengan status DRAFT yang bisa diedit',
    })
  }

  // Prevent deleting last item
  if (po.items.length <= 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tidak bisa menghapus item terakhir. Minimal 1 item harus ada.',
    })
  }

  // Get item to get total amount and product info
  const item = await prisma.purchaseOrderItem.findUnique({
    where: { id: itemId },
    select: {
      total: true,
      purchaseOrderId: true,
      projectItemId: true,
      productId: true,
      price: true,
    },
  })

  if (!item || item.purchaseOrderId !== poId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item tidak ditemukan',
    })
  }

  // Delete item and update PO total in transaction
  await prisma.$transaction(async tx => {
    // Delete the item
    await tx.purchaseOrderItem.delete({
      where: { id: itemId },
    })

    // Recalculate PO subtotal and total
    const remainingItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
      select: { total: true },
    })

    const subtotal = remainingItems.reduce((sum, i) => sum + Number(i.total), 0)

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

    // Update ALL project items yang di-group ke PO item ini kembali ke PENDING
    if (item.productId) {
      // Find all project items yang punya produk yang sama (tidak peduli harga)
      const relatedProjectItems = await tx.projectItem.findMany({
        where: {
          productId: item.productId,
          poStatus: 'ORDERED',
          needsPo: true,
        },
      })

      // Update semua related items kembali ke PENDING
      if (relatedProjectItems.length > 0) {
        await tx.projectItem.updateMany({
          where: {
            id: { in: relatedProjectItems.map(i => i.id) },
          },
          data: {
            poStatus: 'PENDING',
          },
        })
      }
    }
  })

  return { success: true }
})
