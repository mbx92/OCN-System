import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  // Get query params
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const skip = (page - 1) * limit

  const category = query.category as string
  const status = query.status as string
  const condition = query.condition as string
  const search = query.search as string

  // Build where clause
  const where: any = {}

  if (category) {
    where.category = {
      contains: category,
      mode: 'insensitive',
    }
  }

  if (status) {
    where.status = status
  }

  if (condition) {
    where.condition = condition
  }

  if (search) {
    where.OR = [
      {
        assetNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        serialNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        location: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ]
  }

  try {
    // Get total count
    const total = await prisma.asset.count({ where })

    // Get assets
    const assets = await prisma.asset.findMany({
      where,
      orderBy: {
        purchaseDate: 'desc',
      },
      skip,
      take: limit,
    })

    return {
      data: assets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error: any) {
    console.error('Error fetching assets:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch assets',
    })
  }
})
