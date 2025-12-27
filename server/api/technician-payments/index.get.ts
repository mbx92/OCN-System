import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // Get query params
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const skip = (page - 1) * limit

  const technicianId = query.technicianId as string
  const projectId = query.projectId as string
  const status = query.status as string
  const period = query.period as string
  const search = query.search as string

  // Build where clause
  const where: any = {}

  if (technicianId) {
    where.technicianId = technicianId
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (status) {
    where.status = status
  }

  if (period) {
    where.period = period
  }

  if (search) {
    where.OR = [
      {
        paymentNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ]
  }

  try {
    // Get total count
    const total = await prisma.technicianPayment.count({ where })

    // Get payments with technician and project info
    const payments = await prisma.technicianPayment.findMany({
      where,
      include: {
        technician: {
          select: {
            name: true,
            phone: true,
          },
        },
        project: {
          select: {
            projectNumber: true,
            title: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error: any) {
    console.error('Error fetching technician payments:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch technician payments',
    })
  }
})
