export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID supplier tidak valid',
    })
  }

  // Check if supplier has related purchase orders
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          purchaseOrders: true,
        },
      },
    },
  })

  if (!supplier) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Supplier tidak ditemukan',
    })
  }

  if (supplier._count.purchaseOrders > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Supplier tidak dapat dihapus karena memiliki Purchase Order',
    })
  }

  await prisma.supplier.delete({
    where: { id },
  })

  return { success: true }
})
