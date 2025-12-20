import { z } from 'zod'

const createPaymentSchema = z.object({
  projectId: z.string().optional().nullable(),
  mode: z.enum(['PROJECT', 'POS']),
  type: z.enum(['FULL', 'DP', 'INSTALLMENT', 'SETTLEMENT']),
  amount: z.number().min(0),
  method: z.string().min(1, 'Metode pembayaran wajib diisi'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable(),
})

export default defineEventHandler(async event => {
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
      method: data.method,
      reference: data.reference || null,
      notes: data.notes || null,
      receivedBy: data.receivedBy || null,
    },
    include: {
      project: {
        select: {
          id: true,
          projectNumber: true,
          title: true,
        },
      },
    },
  })

  return payment
})
