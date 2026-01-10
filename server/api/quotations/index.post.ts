import { z } from 'zod'
import dayjs from 'dayjs'

const quotationSchema = z.object({
  customerId: z.string().min(1, 'Pelanggan harus dipilih'),
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional().nullable(),
        name: z.string().min(1),
        quantity: z.number().min(1),
        unit: z.string().min(1),
        price: z.number().min(0),
      })
    )
    .min(1, 'Minimal 1 item'),
  validDays: z.number().default(14),
  notes: z.string().optional().nullable(),
  quotationDate: z.string().optional().nullable(), // Support backdate
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = quotationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.errors[0].message,
    })
  }

  // Use custom date if provided (backdate), otherwise use now
  const quotationDate = result.data.quotationDate ? dayjs(result.data.quotationDate) : dayjs()

  // Generate quotation number based on the selected date (backdate support)
  const startOfMonth = quotationDate.startOf('month').toDate()
  const endOfMonth = quotationDate.endOf('month').toDate()
  const count = await prisma.quotation.count({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  })
  const quotationNo = `QT-${quotationDate.format('YYYYMM')}-${String(count + 1).padStart(3, '0')}`

  // Calculate total
  const items = result.data.items.map(item => ({
    ...item,
    total: item.quantity * item.price,
  }))
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  const quotation = await prisma.quotation.create({
    data: {
      quotationNo,
      customerId: result.data.customerId,
      title: result.data.title || null,
      items,
      totalAmount,
      validUntil: quotationDate.add(result.data.validDays, 'day').toDate(),
      notes: result.data.notes || null,
      status: 'DRAFT',
      createdAt: quotationDate.toDate(), // Use custom date (backdate)
    },
    include: {
      project: true,
    },
  })

  return quotation
})
