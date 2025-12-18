export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const technician = await prisma.technician.findUnique({
    where: { id },
    include: {
      assignments: { take: 1 },
    },
  })

  if (!technician) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Teknisi tidak ditemukan',
    })
  }

  if (technician.assignments.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Teknisi tidak dapat dihapus karena masih ada assignment proyek',
    })
  }

  await prisma.technician.delete({
    where: { id },
  })

  return { success: true, message: 'Teknisi berhasil dihapus' }
})
