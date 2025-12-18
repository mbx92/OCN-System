import { z } from 'zod'

const updateQuotationSchema = z.object({
  customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
  title: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().nullable().optional(),
        name: z.string().min(1, 'Nama item wajib diisi'),
        quantity: z.number().min(1, 'Qty minimal 1'),
        unit: z.string().min(1, 'Unit wajib diisi'),
        price: z.number().min(0, 'Harga tidak boleh negatif'),
      })
    )
    .min(1, 'Minimal 1 item'),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  // Check if quotation exists and is still DRAFT
  const existing = await prisma.quotation.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Penawaran tidak ditemukan',
    })
  }

  if (existing.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya penawaran dengan status DRAFT yang dapat diedit',
    })
  }

  const result = updateQuotationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { customerId, title, validUntil, notes, items } = result.data

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0)

  // Format items for Json field
  const formattedItems = items.map((item, index) => ({
    productId: item.productId || null,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    price: item.price,
    totalPrice: item.quantity * item.price,
    sortOrder: index,
  }))

  // Update quotation (items is a Json field, not a relation)
  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      customerId,
      title: title || null,
      validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
      notes: notes || null,
      totalAmount,
      items: formattedItems,
    },
    include: {
      customer: true,
    },
  })

  return quotation
})
