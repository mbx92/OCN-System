import { z } from 'zod'
import { logActivity, ActivityAction, ActivityEntity } from '../../../utils/logger'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']),
  paidDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async event => {
  const user = event.context.user
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID pembayaran tidak valid',
    })
  }

  const result = updateStatusSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  // Cek apakah payment exist
  const existing = await prisma.payment.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pembayaran tidak ditemukan',
    })
  }

  const oldStatus = existing.status

  // Update payment status
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: data.status,
      paidDate: data.paidDate
        ? new Date(data.paidDate)
        : data.status === 'PAID'
          ? new Date()
          : null,
      notes: data.notes || existing.notes,
    },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
  })

  // Jika status berubah dari UNPAID ke PAID, create cash transaction
  if (oldStatus !== 'PAID' && data.status === 'PAID') {
    await prisma.cashTransaction.create({
      data: {
        type: 'INCOME',
        category: 'PAYMENT',
        amount: Number(payment.amount),
        description: `Pembayaran ${payment.paymentNumber}${payment.project ? ` - ${payment.project.projectNumber}` : ''} (Invoice Paid)`,
        reference: payment.paymentNumber,
        referenceType: 'Payment',
        referenceId: payment.id,
        date: new Date(),
      },
    })

    // Send Telegram notification
    if (payment.project) {
      const { notifyPaymentReceived } = await import('../../../utils/telegram')
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
  await logActivity({
    userId: user.id,
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.PAYMENT,
    entityId: payment.id,
    metadata: {
      details: `Status pembayaran ${payment.paymentNumber} diubah dari ${oldStatus} menjadi ${data.status}`,
    },
    ipAddress: event.node.req.socket.remoteAddress,
  })

  return payment
})
