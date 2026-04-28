import { z } from 'zod'
import { logActivity, ActivityAction, ActivityEntity } from '../../utils/logger'

const createPaymentSchema = z.object({
  invoiceId: z.string().optional().nullable(),
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
  paymentDate: z.string().datetime().optional().nullable(), // Support backdate
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

  // Enforce invoice-first flow for project payments.
  // PROJECT with PAID/PARTIAL status must reference an existing invoice.
  if (
    data.mode === 'PROJECT' &&
    (data.status === 'PAID' || data.status === 'PARTIAL') &&
    !data.invoiceId
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pembayaran proyek wajib dari invoice. Buat invoice terlebih dahulu.',
    })
  }

  if (data.mode === 'PROJECT' && !data.invoiceId && !data.projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project wajib dipilih untuk membuat invoice',
    })
  }

  // If invoiceId is provided, record payment against that invoice
  // instead of creating a brand-new payment row from project data.
  if (data.invoiceId) {
    const existingInvoice = await prisma.payment.findUnique({
      where: { id: data.invoiceId },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
      },
    })

    if (!existingInvoice) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice tidak ditemukan',
      })
    }

    if (existingInvoice.mode !== 'PROJECT') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invoice tidak valid untuk pembayaran proyek',
      })
    }

    if (existingInvoice.status === 'PAID' || existingInvoice.status === 'CANCELLED') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invoice sudah lunas atau dibatalkan',
      })
    }

    // Use custom payment date if provided (backdate), otherwise use now
    const invoicePaymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
    const nextStatus = data.status === 'PARTIAL' ? 'PARTIAL' : 'PAID'

    const payment = await prisma.payment.update({
      where: { id: existingInvoice.id },
      data: {
        // Keep invoice base data and only update payment-related fields.
        method: data.method,
        reference: data.reference || existingInvoice.reference,
        notes: data.notes || existingInvoice.notes,
        receivedBy: data.receivedBy || existingInvoice.receivedBy,
        status: nextStatus,
        paymentDate: invoicePaymentDate,
        paidDate: nextStatus === 'PAID' ? invoicePaymentDate : null,
      },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
      },
    })

    // Record cash transaction only when invoice becomes PAID.
    if (existingInvoice.status !== 'PAID' && payment.status === 'PAID') {
      await prisma.cashTransaction.create({
        data: {
          type: 'INCOME',
          category: 'PAYMENT',
          amount: Number(payment.amount),
          description: `Pembayaran ${payment.paymentNumber}${payment.project ? ` - ${payment.project.projectNumber}` : ''}`,
          reference: payment.paymentNumber,
          referenceType: 'Payment',
          referenceId: payment.id,
          date: invoicePaymentDate,
        },
      })

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

    if (user) {
      await logActivity({
        userId: user.id,
        action: ActivityAction.CREATE_PAYMENT,
        entity: ActivityEntity.Payment,
        entityId: payment.id,
        metadata: {
          paymentNumber: payment.paymentNumber,
          invoiceId: existingInvoice.id,
          projectId: payment.projectId,
          type: payment.type,
          amount: payment.amount,
          flow: 'invoice-payment',
        },
      })
    }

    return payment
  }

  // Use custom payment date if provided (backdate), otherwise use now
  const paymentDateToUse = data.paymentDate ? new Date(data.paymentDate) : new Date()

  // Generate payment number: PAY-YYYYMMDD-XXX (using payment date, not today)
  const dateStr = paymentDateToUse.toISOString().slice(0, 10).replace(/-/g, '')
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
      paymentDate: paymentDateToUse, // Use custom date (backdate support)
      paidDate: data.paidDate
        ? new Date(data.paidDate)
        : data.status === 'PAID'
          ? paymentDateToUse // Also use same date for paidDate
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
        date: paymentDateToUse, // Use same date as payment (backdate support)
      },
    })

    // Send Telegram notification for paid payment (Receipt/Kwitansi)
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
  } else if (payment.status === 'UNPAID' || payment.status === 'PARTIAL') {
    // Send Telegram notification for invoice (UNPAID/PARTIAL)
    if (payment.project) {
      const { notifyInvoiceCreated } = await import('../../utils/telegram')
      notifyInvoiceCreated({
        amount: payment.amount,
        projectNumber: payment.project.projectNumber,
        customerName: payment.project.customer.name,
        paymentNumber: payment.paymentNumber,
        dueDate: payment.dueDate,
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
