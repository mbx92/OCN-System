export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const technicianId = getRouterParam(event, 'technicianId')

  if (!projectId || !technicianId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek atau teknisi tidak ditemukan',
    })
  }

  // Check if assignment exists
  const assignment = await prisma.projectTechnician.findFirst({
    where: {
      projectId,
      technicianId,
    },
  })

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Teknisi tidak ditemukan di proyek ini',
    })
  }

  // Delete the assignment
  await prisma.projectTechnician.delete({
    where: { id: assignment.id },
  })

  return { success: true, message: 'Teknisi berhasil dihapus dari proyek' }
})
