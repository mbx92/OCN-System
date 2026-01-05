import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const search = (query.search as string) || ''

  const skip = (page - 1) * limit

  const where: any = {}

  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }
  }

  const [stockOpnames, total] = await Promise.all([
    prisma.stockOpname.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockOpname.count({ where }),
  ])

  return {
    data: stockOpnames,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
