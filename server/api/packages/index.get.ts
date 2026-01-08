export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const search = (query.search as string) || ''
  const category = (query.category as string) || ''
  const isActive = query.isActive === 'false' ? false : query.isActive === 'true' ? true : undefined

  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = category
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  const [packages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.package.count({ where }),
  ])

  return {
    data: packages,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
