// Get cash advances untuk teknisi
export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const { technicianId, status } = query

  try {
    const where: any = {}

    if (technicianId) {
      where.technicianId = technicianId as string
    }

    if (status) {
      where.status = status as string
    }

    const cashAdvances = await prisma.technicianCashAdvance.findMany({
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

    return cashAdvances
  } catch (error: any) {
    console.error('Error fetching cash advances:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch cash advances',
    })
  }
})
