import dayjs from 'dayjs'

export default defineEventHandler(async () => {
  const startOfMonth = dayjs().startOf('month').toDate()
  const endOfMonth = dayjs().endOf('month').toDate()

  // Active projects count
  const activeProjects = await prisma.project.count({
    where: {
      status: { in: ['QUOTATION', 'APPROVED', 'PROCUREMENT', 'ONGOING'] },
    },
  })

  // Ongoing projects
  const ongoingProjects = await prisma.project.count({
    where: { status: 'ONGOING' },
  })

  // Monthly revenue (payments this month)
  const paymentsThisMonth = await prisma.payment.aggregate({
    where: {
      paymentDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: { amount: true },
  })

  // Completed projects count this month
  const completedProjects = await prisma.project.count({
    where: {
      status: 'COMPLETED',
      updatedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })

  // Total payments count
  const totalPayments = await prisma.payment.count()

  // Total customers
  const totalCustomers = await prisma.customer.count()

  // New customers this month
  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })

  return {
    activeProjects,
    ongoingProjects,
    monthlyRevenue: paymentsThisMonth._sum.amount?.toNumber() || 0,
    completedProjects,
    totalPayments,
    totalCustomers,
    newCustomers,
  }
})
