export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const status = query.status as string
  const projectId = query.projectId as string
  const customerId = query.customerId as string
  const search = query.search as string

  const where: any = {}

  if (status) {
    where.status = status
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (customerId) {
    where.customerId = customerId
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { project: { projectNumber: { contains: search, mode: 'insensitive' } } },
      { project: { customer: { name: { contains: search, mode: 'insensitive' } } } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.maintenanceSchedule.findMany({
      where,
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        customer: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.maintenanceSchedule.count({ where }),
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
