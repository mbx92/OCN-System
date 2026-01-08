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

  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : 10

  // Get projects assigned to this technician
  const assignments = await prisma.projectTechnician.findMany({
    where: {
      technicianId: technician.id,
    },
    include: {
      project: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      project: {
        createdAt: 'desc',
      },
    },
    take: limit,
  })

  return assignments.map(assignment => ({
    id: assignment.id,
    projectId: assignment.projectId,
    projectName: assignment.project.name,
    projectCode: assignment.project.projectCode,
    customer: assignment.project.customer?.name || '-',
    status: assignment.project.status,
    fee: assignment.fee.toNumber(),
    isPaid: assignment.isPaid,
    description: assignment.project.description,
    createdAt: assignment.project.createdAt,
    updatedAt: assignment.project.updatedAt,
  }))
})
