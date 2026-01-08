// API untuk Bonus Teknisi
export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { technicianId, amount, bonusType, description, period, notes } = body

  if (!technicianId || !amount || !bonusType || !description) {
    throw createError({
      statusCode: 400,
      message: 'Technician ID, amount, type, and description are required',
    })
  }

  try {
    const bonus = await prisma.technicianBonus.create({
      data: {
        technicianId,
        amount: parseFloat(amount),
        bonusType,
        description,
        period: period || null,
        notes: notes || null,
      },
      include: {
        technician: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'BONUS',
        entityId: bonus.id,
        metadata: {
          technicianId,
          technicianName: bonus.technician.name,
          amount,
          bonusType,
          description,
        },
      },
    })

    return {
      success: true,
      data: bonus,
      message: 'Bonus created successfully',
    }
  } catch (error: any) {
    console.error('Error creating bonus:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create bonus',
    })
  }
})
