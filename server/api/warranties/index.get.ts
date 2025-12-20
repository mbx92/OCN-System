export default defineEventHandler(async event => {
  const query = getQuery(event) as {
    status?: string
    page?: string
    limit?: string
  }

  const status = query.status
  const page = parseInt(query.page || '1')
  const limit = parseInt(query.limit || '20')
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) {
    where.status = status
  }

  const [warranties, total] = await Promise.all([
    prisma.warranty.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            title: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        claims: {
          orderBy: { reportedDate: 'desc' },
          take: 1,
        },
        _count: {
          select: { claims: true },
        },
      },
      orderBy: { endDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.warranty.count({ where }),
  ])

  return {
    data: warranties,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
