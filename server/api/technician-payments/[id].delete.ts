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

    // Delete payment
    await prisma.technicianPayment.delete({
      where: { id },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'DELETE_TECHNICIAN_PAYMENT',
        entity: 'TechnicianPayment',
        entityId: id,
        metadata: {
          paymentNumber: existingPayment.paymentNumber,
          amount: existingPayment.amount,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return {
      success: true,
      message: 'Technician payment deleted successfully',
    }
  } catch (error: any) {
    console.error('Error deleting technician payment:', error)
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete technician payment',
    })
  }
})
