// API untuk convert budget ke quotation
import { z } from 'zod'
import dayjs from 'dayjs'

const convertSchema = z.object({
  validDays: z.number().default(14),
})

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Budget ID is required' })
  }

  const body = await readBody(event)
  const result = convertSchema.safeParse(body)

  const validDays = result.success ? result.data.validDays : 14

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  })

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
  }

  if (budget.status !== 'APPROVED') {
    throw createError({
      statusCode: 400,
      message: 'Hanya budget APPROVED yang bisa diconvert ke penawaran',
    })
  }

  if (!budget.customerId) {
    throw createError({
      statusCode: 400,
      message: 'Budget harus memiliki customer untuk diconvert ke penawaran',
    })
  }

  // Generate quotation number
  const now = dayjs()
  const startOfMonth = now.startOf('month').toDate()
  const endOfMonth = now.endOf('month').toDate()
  const count = await prisma.quotation.count({
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
  })
  const quotationNo = `QT-${now.format('YYYYMM')}-${String(count + 1).padStart(3, '0')}`

  // Convert budget items to quotation items format
  const items = budget.items.map(item => ({
    productId: null, // Budget items are manual entry
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    price: Number(item.sellPrice),
    total: Number(item.totalPrice),
  }))

  // Create quotation in transaction
  const [quotation, _] = await prisma.$transaction([
    prisma.quotation.create({
      data: {
        quotationNo,
        customerId: budget.customerId,
        title: budget.title,
        items,
        totalAmount: budget.totalPrice,
        status: 'DRAFT',
        validUntil: now.add(validDays, 'day').toDate(),
        notes: budget.notes,
      },
      include: {
        customer: true,
      },
    }),
    prisma.budget.update({
      where: { id },
      data: {
        status: 'CONVERTED',
      },
    }),
  ])

  // Update budget with quotation ID
  await prisma.budget.update({
    where: { id },
    data: { quotationId: quotation.id },
  })

  return {
    success: true,
    message: 'Budget berhasil diconvert ke penawaran',
    quotation,
  }
})
