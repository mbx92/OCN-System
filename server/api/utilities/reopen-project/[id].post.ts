export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')

  // Get current user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak valid',
    })
  }

  // Check if project exists and is completed
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      projectNumber: true,
      status: true,
      title: true,
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  if (project.status !== 'COMPLETED') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Proyek tidak dalam status COMPLETED',
    })
  }

  // Update project status to ONGOING
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'ONGOING',
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'REOPEN_PROJECT',
      entity: 'Project',
      entityId: projectId,
      metadata: {
        projectNumber: project.projectNumber,
        projectTitle: project.title,
        previousStatus: 'COMPLETED',
        newStatus: 'ONGOING',
      },
      ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
    },
  })

  return {
    success: true,
    message: `Proyek ${project.projectNumber} berhasil dibuka kembali`,
    project: updatedProject,
  }
})
