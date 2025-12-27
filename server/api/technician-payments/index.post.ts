import { H3Event } from 'h3'

// Generate payment number: PAY-YYYYMM-XXX
async function generatePaymentNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `PAY-${year}${month}`

  // Get last payment with same prefix
  const lastPayment = await prisma.technicianPayment.findFirst({
    where: {
      paymentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      paymentNumber: 'desc',
    },
  })

  let sequence = 1
  if (lastPayment) {
    const lastSequence = parseInt(lastPayment.paymentNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`
}

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody(event)

  const { technicianId, projectId, period, amount, description, status, paidDate, notes } = body

  // Validate required fields
  if (!technicianId || !amount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Validate status
  const validStatuses = ['PENDING', 'PAID', 'CANCELLED']
  if (status && !validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid status value',
    })
  }

  try {
    // Generate payment number
    const paymentNumber = await generatePaymentNumber()

    // Create payment
    const payment = await prisma.technicianPayment.create({
      data: {
        paymentNumber,
        technicianId,
        projectId: projectId || null,
        period: period || null,
        amount: parseFloat(amount),
        description: description || null,
        status: status || 'PENDING',
        paidDate: paidDate ? new Date(paidDate) : null,
        notes: notes || null,
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
        action: 'CREATE_TECHNICIAN_PAYMENT',
        entity: 'TechnicianPayment',
        entityId: payment.id,
        metadata: {
          paymentNumber,
          technicianId,
          amount,
        },
        ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
      },
    })

    return payment
  } catch (error: any) {
    console.error('Error creating technician payment:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create technician payment',
    })
  }
})
