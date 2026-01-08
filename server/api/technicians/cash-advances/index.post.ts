// API untuk Kas Bon (Cash Advance) Teknisi
export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { technicianId, amount, reason, notes } = body

  if (!technicianId || !amount || !reason) {
    throw createError({
      statusCode: 400,
      message: 'Technician ID, amount, and reason are required',
    })
  }

  try {
    const cashAdvance = await prisma.technicianCashAdvance.create({
      data: {
        technicianId,
        amount: parseFloat(amount),
        reason,
        remainingAmount: parseFloat(amount),
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
        entity: 'CASH_ADVANCE',
        entityId: cashAdvance.id,
        metadata: {
          technicianId,
          technicianName: cashAdvance.technician.name,
          amount,
          reason,
        },
      },
    })

    return {
      success: true,
      data: cashAdvance,
      message: 'Cash advance created successfully',
    }
  } catch (error: any) {
    console.error('Error creating cash advance:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create cash advance',
    })
  }
})
