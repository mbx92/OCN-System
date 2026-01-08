import dayjs from 'dayjs'

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

  const startOfMonth = dayjs().startOf('month').toDate()
  const endOfMonth = dayjs().endOf('month').toDate()

  // Active projects (assigned to this technician)
  const activeProjects = await prisma.projectTechnician.count({
    where: {
      technicianId: technician.id,
      project: {
        status: { in: ['APPROVED', 'PROCUREMENT', 'ONGOING'] },
      },
    },
  })

  // Completed projects this month
  const completedProjects = await prisma.projectTechnician.count({
    where: {
      technicianId: technician.id,
      project: {
        status: 'COMPLETED',
        updatedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    },
  })

  // Total earnings this month (from payments)
  const paymentsThisMonth = await prisma.technicianPayment.aggregate({
    where: {
      technicianId: technician.id,
      paymentDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  })

  // Pending payment (unpaid assignments)
  const unpaidAssignments = await prisma.projectTechnician.findMany({
    where: {
      technicianId: technician.id,
      isPaid: false,
      project: {
        status: { in: ['COMPLETED', 'PAID', 'CLOSED'] },
      },
    },
    select: {
      fee: true,
    },
  })

  const pendingPayment = unpaidAssignments.reduce(
    (sum, assignment) => sum + Number(assignment.fee),
    0
  )

  return {
    activeProjects,
    completedProjects,
    totalEarnings: paymentsThisMonth._sum.amount?.toNumber() || 0,
    pendingPayment,
  }
})
