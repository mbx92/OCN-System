export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const status = query.status as string
  const search = query.search as string

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (search) {
    where.OR = [
      { claimNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { warranty: { warrantyNumber: { contains: search, mode: 'insensitive' } } },
      { warranty: { project: { customer: { name: { contains: search, mode: 'insensitive' } } } } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.warrantyClaim.findMany({
      where,
      include: {
        warranty: {
          include: {
            project: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.warrantyClaim.count({ where }),
  ])

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
