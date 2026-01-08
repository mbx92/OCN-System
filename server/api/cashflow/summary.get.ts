// GET /api/cashflow/summary - Get cashflow summary (totals)
export default defineEventHandler(async event => {
  const query = getQuery(event)
  const dateFrom = query.dateFrom as string
  const dateTo = query.dateTo as string

  const where: any = {}

  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) {
      where.date.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.date.lte = new Date(dateTo + 'T23:59:59')
    }
  }

  // Get totals by type
  const [incomeResult, expenseResult] = await Promise.all([
    prisma.cashTransaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.cashTransaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const totalIncome = Number(incomeResult._sum.amount || 0)
  const totalExpense = Number(expenseResult._sum.amount || 0)
  const balance = totalIncome - totalExpense

  // Get breakdown by category
  const categoryBreakdown = await prisma.cashTransaction.groupBy({
    by: ['type', 'category'],
    where,
    _sum: { amount: true },
    _count: true,
  })

  return {
    totalIncome,
    totalExpense,
    balance,
    incomeCount: incomeResult._count,
    expenseCount: expenseResult._count,
    categoryBreakdown: categoryBreakdown.map(item => ({
      type: item.type,
      category: item.category,
      total: Number(item._sum.amount || 0),
      count: item._count,
    })),
  }
})
