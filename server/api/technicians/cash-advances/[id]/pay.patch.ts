// API endpoint untuk membayar kas bon (cicil atau lunas)
export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { amount, paidDate, notes } = body

  if (!amount || amount <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Payment amount must be greater than 0',
    })
  }

  try {
    // Get current cash advance
    const cashAdvance = await prisma.technicianCashAdvance.findUnique({
      where: { id },
      include: {
        technician: true,
      },
    })

    if (!cashAdvance) {
      throw createError({
        statusCode: 404,
        message: 'Cash advance not found',
      })
    }

    if (cashAdvance.status === 'PAID') {
      throw createError({
        statusCode: 400,
        message: 'Cash advance is already paid',
      })
    }

    if (amount > cashAdvance.remainingAmount) {
      throw createError({
        statusCode: 400,
        message: 'Payment amount exceeds remaining balance',
      })
    }

    // Calculate new paid and remaining amounts
    const newPaidAmount = cashAdvance.paidAmount + amount
    const newRemainingAmount = cashAdvance.remainingAmount - amount

    // Determine new status
    let newStatus = cashAdvance.status
    if (newRemainingAmount === 0) {
      newStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    // Update cash advance
    const updated = await prisma.technicianCashAdvance.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidDate: newStatus === 'PAID' ? new Date(paidDate) : cashAdvance.paidDate,
        notes: notes || cashAdvance.notes,
      },
      include: {
        technician: true,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'PAY',
        entity: 'CASH_ADVANCE',
        entityId: id,
        metadata: {
          technicianName: cashAdvance.technician.name,
          paymentAmount: amount,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
      },
    })

    return updated
  } catch (error: any) {
    console.error('Error processing cash advance payment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process payment',
    })
  }
})
