// GET /api/cashflow - List cash transactions with filters
export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const type = query.type as string // INCOME or EXPENSE
  const category = query.category as string
  const dateFrom = query.dateFrom as string
  const dateTo = query.dateTo as string

  const where: any = {}

  if (type) {
    where.type = type
  }

  if (category) {
    where.category = category
  }

  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) {
      where.date.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.date.lte = new Date(dateTo + 'T23:59:59')
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.cashTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cashTransaction.count({ where }),
  ])

  return {
    data: transactions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
