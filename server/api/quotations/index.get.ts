export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const status = query.status as string
  const search = query.search as string

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  }

  if (search) {
    where.OR = [
      { quotationNo: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quotation.count({ where }),
  ])

  return {
    data: quotations,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
