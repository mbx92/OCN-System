import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payment ID is required',
    })
  }

  const body = await readBody(event)

  const { technicianId, projectId, period, amount, description, status, paidDate, notes } = body

  // Validate status if provided
  if (status) {
    const validStatuses = ['PENDING', 'PAID', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status value',
      })
    }
  }

  try {
    // Check if payment exists
    const existingPayment = await prisma.technicianPayment.findUnique({
      where: { id },
    })

    if (!existingPayment) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Payment not found',
      })
    }

    // Update payment
    const payment = await prisma.technicianPayment.update({
      where: { id },
      data: {
        ...(technicianId && { technicianId }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(period !== undefined && { period: period || null }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description: description || null }),
        ...(status && { status }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
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
          },
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TECHNICIAN_PAYMENT',
        entity: 'TechnicianPayment',
        entityId: payment.id,
        metadata: {
          paymentNumber: payment.paymentNumber,
          status: payment.status,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return payment
  } catch (error: any) {
    console.error('Error updating technician payment:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update technician payment',
    })
  }
})
