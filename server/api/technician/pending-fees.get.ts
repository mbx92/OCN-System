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

  // Get unpaid assignments for completed/paid/closed projects
  const unpaidAssignments = await prisma.projectTechnician.findMany({
    where: {
      technicianId: technician.id,
      isPaid: false,
      project: {
        status: { in: ['COMPLETED', 'PAID', 'CLOSED'] },
      },
    },
    include: {
      project: {
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      project: {
        updatedAt: 'desc',
      },
    },
  })

  return unpaidAssignments.map(assignment => ({
    id: assignment.id,
    projectId: assignment.projectId,
    projectName: assignment.project.name,
    projectCode: assignment.project.projectCode,
    customer: assignment.project.customer?.name || '-',
    status: assignment.project.status,
    fee: assignment.fee.toNumber(),
  }))
})
