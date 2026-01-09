import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  // Set no-cache header untuk memastikan data selalu fresh
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  const startOfMonth = dayjs().startOf('month').toDate()
  const endOfMonth = dayjs().endOf('month').toDate()
  const now = new Date()

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

  // Monthly revenue (hitung pembayaran dengan status PAID bulan ini)
  // Use OR condition: paidDate in range OR (status PAID and paymentDate in range when paidDate is null)
  const paymentsThisMonth = await prisma.payment.aggregate({
    where: {
      status: 'PAID',
      OR: [
        {
          paidDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          paidDate: null,
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      ],
    },
    _sum: { amount: true },
  })

  // Count payments dengan status PAID bulan ini
  const paidProjectsCount = await prisma.payment.count({
    where: {
      status: 'PAID',
      OR: [
        {
          paidDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          paidDate: null,
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      ],
    },
  })

  // Pembayaran tertunda - hitung dari payment dengan status belum lunas
  const unpaidPayments = await prisma.payment.findMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
    },
    select: {
      amount: true,
      status: true,
    },
  })

  let pendingPayments = unpaidPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Jika tidak ada unpaid payment, hitung dari project remaining amount
  if (pendingPayments === 0) {
    const projectsWithRemaining = await prisma.project.findMany({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        payments: {
          where: { status: 'PAID' },
        },
      },
    })

    pendingPayments = (projectsWithRemaining as any[]).reduce((sum, p) => {
      const projectTotal = Number(p.finalPrice || p.budget || 0)
      const paidAmount =
        p.payments?.reduce((ps: number, pay: any) => ps + Number(pay.amount || 0), 0) || 0
      const remaining = projectTotal - paidAmount
      return sum + (remaining > 0 ? remaining : 0)
    }, 0)
  }

  // Count invoice yang overdue (jatuh tempo)
  const overdueCount = await prisma.payment.count({
    where: {
      status: 'OVERDUE',
    },
  })

  // Jika tidak ada overdue dari payment, cek dari dueDate
  let overdueInvoices = overdueCount

  if (overdueCount === 0) {
    overdueInvoices = await prisma.payment.count({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: {
          lt: now,
        },
      },
    })
  }

  // Total customers
  const totalCustomers = await prisma.customer.count()

  // New customers in last 1-2 days (24-48 hours ago)
  const twoDaysAgo = dayjs().subtract(2, 'day').toDate()
  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: twoDaysAgo,
      },
    },
  })

  return {
    activeProjects,
    ongoingProjects,
    monthlyRevenue: paymentsThisMonth._sum.amount?.toNumber() || 0,
    paidProjects: paidProjectsCount,
    pendingPayments: pendingPayments,
    overdueCount: overdueInvoices,
    totalCustomers,
    newCustomers,
  }
})
