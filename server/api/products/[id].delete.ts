export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      projectItems: true,
      purchaseOrderItems: true,
    },
  })

  if (!product) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Produk tidak ditemukan',
    })
  }

  // Check if product is used in projects or POs
  if (product.projectItems.length > 0 || product.purchaseOrderItems.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Produk tidak dapat dihapus karena masih digunakan dalam proyek atau PO',
    })
  }

  await prisma.product.delete({
    where: { id },
  })

  return { success: true, message: 'Produk berhasil dihapus' }
})
