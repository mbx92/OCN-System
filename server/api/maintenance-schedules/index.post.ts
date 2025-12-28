export default defineEventHandler(async event => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  const { projectId, title, description, scheduledDate, notes } = body

  if (!projectId || !title || !scheduledDate) {
    throw createError({
      statusCode: 400,
      message: 'Project, judul, dan tanggal jadwal wajib diisi',
    })
  }

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      message: 'Proyek tidak ditemukan',
    })
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      projectId,
      title,
      description: description || null,
      scheduledDate: new Date(scheduledDate),
      notes: notes || null,
      createdBy: session.user.id,
    },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return schedule
})
