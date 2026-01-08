// Get bonuses untuk teknisi
export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const { technicianId, bonusType, period } = query

  try {
    const where: any = {}

    if (technicianId) {
      where.technicianId = technicianId as string
    }

    if (bonusType) {
      where.bonusType = bonusType as string
    }

    if (period) {
      where.period = period as string
    }

    const bonuses = await prisma.technicianBonus.findMany({
      where,
      include: {
        technician: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return bonuses
  } catch (error: any) {
    console.error('Error fetching bonuses:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch bonuses',
    })
  }
})
