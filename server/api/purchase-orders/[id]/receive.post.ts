export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  // Get PO with items
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!purchaseOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Purchase Order tidak ditemukan',
    })
  }

  if (purchaseOrder.status === 'RECEIVED') {
    throw createError({
      statusCode: 400,
      statusMessage: 'PO sudah diterima sebelumnya',
    })
  }

  if (purchaseOrder.status === 'CANCELLED') {
    throw createError({
      statusCode: 400,
      statusMessage: 'PO sudah dibatalkan',
    })
  }

  if (purchaseOrder.status !== 'PROGRESS') {
    throw createError({
      statusCode: 400,
      statusMessage: 'PO harus dalam status Progress untuk dapat diterima',
    })
  }

  // Process receive in transaction
  const result = await prisma.$transaction(async tx => {
    // Update PO status
    const updatedPO = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date(),
      },
    })

    // Update each item's receivedQty and add stock
    for (const item of purchaseOrder.items) {
      // Update receivedQty
      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          receivedQty: item.quantity,
        },
      })

      // Add to stock if product exists
      if (item.productId) {
        // Get product to check conversion factor
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        // Calculate stock quantity with conversion
        // e.g., buy 2 roll with factor 305 = 610 meter
        const conversionFactor = product?.conversionFactor ? Number(product.conversionFactor) : 1
        const stockQty = Math.round(item.quantity * conversionFactor)

        const stock = await tx.stock.findUnique({
          where: { productId: item.productId },
        })

        if (stock) {
          await tx.stock.update({
            where: { productId: item.productId },
            data: {
              quantity: { increment: stockQty },
              available: { increment: stockQty },
            },
          })
        } else {
          // Create stock if doesn't exist
          await tx.stock.create({
            data: {
              productId: item.productId,
              quantity: stockQty,
              reserved: 0,
              available: stockQty,
            },
          })
        }
      }
    }

    return updatedPO
  })

  return {
    success: true,
    message: `PO ${result.poNumber} berhasil diterima. Stok telah ditambahkan.`,
    purchaseOrder: result,
  }
})
