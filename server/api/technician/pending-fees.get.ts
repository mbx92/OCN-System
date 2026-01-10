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

  // Get all paid payments for this technician to filter out already-paid assignments
  const paidPayments = await prisma.technicianPayment.findMany({
    where: {
      technicianId: technician.id,
      status: 'PAID',
    },
    select: {
      projectId: true,
    },
  })

  // Create a set of projectIds that have been paid
  const paidProjectIds = new Set(paidPayments.map(p => p.projectId).filter(Boolean))

  // Filter out assignments that already have a paid payment record
  const trulyUnpaidAssignments = unpaidAssignments.filter(a => !paidProjectIds.has(a.projectId))

  return trulyUnpaidAssignments.map(assignment => ({
    id: assignment.id,
    projectId: assignment.projectId,
    projectName: assignment.project.title,
    projectCode: assignment.project.projectNumber,
    customer: assignment.project.customer?.name || '-',
    status: assignment.project.status,
    fee: assignment.fee.toNumber(),
  }))
})
