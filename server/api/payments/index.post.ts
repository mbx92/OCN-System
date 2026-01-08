import { z } from 'zod'
import { logActivity, ActivityAction, ActivityEntity } from '../../utils/logger'

const createPaymentSchema = z.object({
  projectId: z.string().optional().nullable(),
  mode: z.enum(['PROJECT', 'POS']),
  type: z.enum(['FULL', 'DP', 'INSTALLMENT', 'SETTLEMENT']),
  amount: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
  discountNote: z.string().optional().nullable(),
  method: z.string().min(1, 'Metode pembayaran wajib diisi'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable(),
  status: z
    .enum(['PENDING', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'])
    .optional()
    .default('PAID'),
  dueDate: z.string().datetime().optional().nullable(),
  paidDate: z.string().datetime().optional().nullable(),
})

export default defineEventHandler(async event => {
  const user = event.context.user
  const body = await readBody(event)

  const result = createPaymentSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  // Generate payment number: PAY-YYYYMMDD-XXX
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `PAY-${dateStr}-`

  const lastPayment = await prisma.payment.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: 'desc' },
  })

  let sequence = 1
  if (lastPayment) {
    const lastSeq = parseInt(lastPayment.paymentNumber.slice(-3))
    sequence = lastSeq + 1
  }

  const paymentNumber = `${prefix}${String(sequence).padStart(3, '0')}`

  const payment = await prisma.payment.create({
    data: {
      paymentNumber,
      projectId: data.projectId || null,
      mode: data.mode,
      type: data.type,
      amount: data.amount,
      discount: data.discount || 0,
      discountNote: data.discountNote || null,
      method: data.method,
      reference: data.reference || null,
      notes: data.notes || null,
      receivedBy: data.receivedBy || null,
      status: data.status || 'PAID',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paidDate: data.paidDate
        ? new Date(data.paidDate)
        : data.status === 'PAID'
          ? new Date()
          : null,
    },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
  })

  // Record cash transaction (INCOME) only if status is PAID
  if (payment.status === 'PAID') {
    await prisma.cashTransaction.create({
      data: {
        type: 'INCOME',
        category: 'PAYMENT',
        amount: data.amount,
        description: `Pembayaran ${paymentNumber}${payment.project ? ` - ${payment.project.projectNumber}` : ''}`,
        reference: paymentNumber,
        referenceType: 'Payment',
        referenceId: payment.id,
        date: new Date(),
      },
    })

    // Send Telegram notification for paid payment
    if (payment.project) {
      const { notifyPaymentReceived } = await import('../../utils/telegram')
      notifyPaymentReceived({
        amount: payment.amount,
        projectNumber: payment.project.projectNumber,
        customerName: payment.project.customer.name,
        paymentType: payment.type,
        paymentId: payment.id,
      }).catch(err => {
        console.error('Failed to send Telegram notification:', err)
      })
    }
  }

  // Log activity
  if (user) {
    await logActivity({
      userId: user.id,
      action: ActivityAction.CREATE_PAYMENT,
      entity: ActivityEntity.Payment,
      entityId: payment.id,
      metadata: {
        paymentNumber: payment.paymentNumber,
        projectId: payment.projectId,
        type: payment.type,
        amount: payment.amount,
      },
    })
  }

  return payment
})
