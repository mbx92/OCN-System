import { z } from 'zod'

const packageSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
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
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = packageSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.errors[0].message,
    })
  }

  // Calculate total
  const items = result.data.items.map(item => ({
    ...item,
    total: item.quantity * item.price,
  }))
  const totalPrice = items.reduce((sum, item) => sum + item.total, 0)

  const packageData = await prisma.package.create({
    data: {
      name: result.data.name,
      description: result.data.description || null,
      category: result.data.category || null,
      totalPrice,
      items: {
        create: items.map(item => ({
          productId: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return packageData
})
