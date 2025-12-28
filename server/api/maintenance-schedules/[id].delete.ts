export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID jadwal tidak valid',
    })
  }

  const existing = await prisma.maintenanceSchedule.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Jadwal tidak ditemukan',
    })
  }

  await prisma.maintenanceSchedule.delete({
    where: { id },
  })

  return { success: true }
})
