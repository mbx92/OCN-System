import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // Get query params
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const skip = (page - 1) * limit

  const type = query.type as string
  const category = query.category as string
  const projectId = query.projectId as string
  const fromDate = query.fromDate as string
  const toDate = query.toDate as string
  const search = query.search as string

  // Build where clause
  const where: any = {}

  if (type) {
    where.type = type
  }

  if (category) {
    where.category = {
      contains: category,
      mode: 'insensitive',
    }
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (fromDate || toDate) {
    where.date = {}
    if (fromDate) {
      where.date.gte = new Date(fromDate)
    }
    if (toDate) {
      where.date.lte = new Date(toDate)
    }
  }

  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        category: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ]
  }

  try {
    // Get total count
    const total = await prisma.expense.count({ where })

    // Get expenses with project info
    const expenses = await prisma.expense.findMany({
      where,
      include: {
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
        createdByUser: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    })

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch expenses',
    })
  }
})
