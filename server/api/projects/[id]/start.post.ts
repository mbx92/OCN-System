export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  if (project.status !== 'APPROVED') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya proyek yang disetujui yang dapat dimulai',
    })
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: 'ONGOING',
      startDate: new Date(),
    },
  })

  return updated
})
