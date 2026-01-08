export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user || user.role !== 'TECHNICIAN') {
    throw createError({
      statusCode: 403,
      message: 'Akses hanya untuk teknisi',
    })
  }

  // Get technician profile
  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
  })

  if (!technician) {
    throw createError({
      statusCode: 404,
      message: 'Data teknisi tidak ditemukan',
    })
  }

  return technician
})
