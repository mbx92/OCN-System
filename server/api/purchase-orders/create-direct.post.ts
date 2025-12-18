import { z } from 'zod'

const createDirectPoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier wajib dipilih'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        quantity: z.number().min(1),
        price: z.number().min(0),
      })
    )
    .min(1, 'Minimal 1 item'),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = createDirectPoSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { supplierId, notes, items } = result.data

  // Generate PO number
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `PO-${year}${month}-`

  const lastPo = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: 'desc' },
  })

  let sequence = 1
  if (lastPo) {
    const lastSeq = parseInt(lastPo.poNumber.split('-').pop() || '0')
    sequence = lastSeq + 1
  }

  const poNumber = `${prefix}${String(sequence).padStart(3, '0')}`

  // Calculate total
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  // Create PO with items
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes: notes || null,
      totalAmount,
      status: 'DRAFT',
      items: {
        create: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
      },
    },
    include: {
      supplier: true,
      items: true,
    },
  })

  return purchaseOrder
})
