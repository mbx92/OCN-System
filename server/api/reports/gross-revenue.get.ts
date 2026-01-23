export default defineEventHandler(async event => {
  const query = getQuery(event)
  const month = parseInt(query.month as string) || new Date().getMonth() + 1
  const year = parseInt(query.year as string) || new Date().getFullYear()

  // Calculate start and end date for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  // Get all PAID payments in this period
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      paidDate: {
        gte: startDate,
        lte: endDate,
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

  // Calculate total gross revenue (amount - discount)
  const totalGrossRevenue = payments.reduce((sum, payment) => {
    return sum + (payment.amount - (payment.discount || 0))
  }, 0)

  const transactionCount = payments.length
  const averageTransaction = transactionCount > 0 ? totalGrossRevenue / transactionCount : 0

  return {
    month,
    year,
    totalGrossRevenue,
    transactionCount,
    averageTransaction,
    transactions: payments,
  }
})
