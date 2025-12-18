export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
  })

  if (!purchaseOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Purchase Order tidak ditemukan',
    })
  }

  if (purchaseOrder.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya PO dengan status DRAFT yang dapat dikirim',
    })
  }

  const updatedPO = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: 'PROGRESS',
    },
  })

  return {
    success: true,
    message: `PO ${updatedPO.poNumber} berhasil dikirim ke supplier`,
    purchaseOrder: updatedPO,
  }
})
