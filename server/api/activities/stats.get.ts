export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const query = getQuery(event)
  const dateFrom = query.dateFrom as string
  const dateTo = query.dateTo as string

  const where: any = {}

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59')
    }
  }

  // Get stats
  const [totalActivities, byAction, byEntity, byUser] = await Promise.all([
    // Total count
    prisma.activity.count({ where }),

    // Group by action
    prisma.activity.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    }),

    // Group by entity
    prisma.activity.groupBy({
      by: ['entity'],
      where: {
        ...where,
        entity: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          entity: 'desc',
        },
      },
      take: 10,
    }),

    // Group by user
    prisma.activity.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    }),
  ])

  // Get user details for top users
  const userIds = byUser.map(u => u.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })

  const topUsers = byUser.map(u => ({
    user: users.find(user => user.id === u.userId),
    count: u._count,
  }))

  return {
    total: totalActivities,
    byAction: byAction.map(a => ({
      action: a.action,
      count: a._count,
    })),
    byEntity: byEntity.map(e => ({
      entity: e.entity,
      count: e._count,
    })),
    topUsers,
  }
})
