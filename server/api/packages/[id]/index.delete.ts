export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID paket tidak valid',
    })
  }

  // Check if package exists
  const existingPackage = await prisma.package.findUnique({
    where: { id },
  })

  if (!existingPackage) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paket tidak ditemukan',
    })
  }

  // Delete package (items will be cascade deleted)
  await prisma.package.delete({
    where: { id },
  })

  return { success: true, message: 'Paket berhasil dihapus' }
})
