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

  // Total earnings this month (from paid TechnicianPayments)
  const paidPaymentsThisMonth = await prisma.technicianPayment.findMany({
    where: {
      technicianId: technician.id,
      status: 'PAID',
      paidDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      amount: true,
    },
  })

  const totalEarnings = paidPaymentsThisMonth.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  )

  // Pending payment (assignments from completed projects that don't have PAID payment record)
  // First get all assignments from completed projects
  const completedAssignments = await prisma.projectTechnician.findMany({
    where: {
      technicianId: technician.id,
      project: {
        status: { in: ['COMPLETED', 'PAID', 'CLOSED'] },
      },
    },
    select: {
      id: true,
      projectId: true,
      fee: true,
      isPaid: true,
    },
  })

  // Get all paid payments for this technician
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

  // Calculate pending = assignments where isPaid is false AND no payment record exists
  const pendingPayment = completedAssignments
    .filter(a => !a.isPaid && !paidProjectIds.has(a.projectId))
    .reduce((sum, assignment) => sum + Number(assignment.fee), 0)

  return {
    activeProjects,
    completedProjects,
    totalEarnings,
    pendingPayment,
  }
})
