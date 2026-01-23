export default defineEventHandler(async event => {
  const { year } = getQuery(event)

  if (!year) {
    throw createError({
      statusCode: 400,
      message: 'Year is required',
    })
  }

  const yearNum = Number(year)

  // Initialize monthly data
  const monthlyData: Record<number, { revenue: number; transactions: number }> = {}
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = { revenue: 0, transactions: 0 }
  }

  // Fetch all PAID payments for the year
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      paidDate: {
        gte: new Date(yearNum, 0, 1), // Jan 1st
        lt: new Date(yearNum + 1, 0, 1), // Jan 1st next year
      },
    },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: {
      paidDate: 'asc',
    },
  })

  let totalRevenue = 0
  let totalTransactions = payments.length

  // Group by month
  payments.forEach(payment => {
    const paidDate = payment.paidDate || payment.createdAt
    const month = paidDate.getMonth() + 1 // 1-12

    const grossRevenue = payment.amount - (payment.discount || 0)

    monthlyData[month].revenue += grossRevenue
    monthlyData[month].transactions += 1
    totalRevenue += grossRevenue
  })

  const averagePerMonth = totalRevenue / 12
  const averagePerTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  return {
    year: yearNum,
    totalRevenue,
    totalTransactions,
    averagePerMonth,
    averagePerTransaction,
    monthlyData,
  }
})
