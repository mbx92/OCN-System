import { z } from 'zod'

const packageSchema = z.object({
  name: z.string().min(1, 'Nama paket harus diisi'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID paket tidak valid',
    })
  }

  const result = packageSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.errors[0].message,
    })
  }

  // Check if package exists
  const existingPackage = await prisma.package.findUnique({
    where: { id },
  })

  if (!existingPackage) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paket tidak ditemukan',
    })
  }

  // Calculate total
  const items = result.data.items.map(item => ({
    ...item,
    total: item.quantity * item.price,
  }))
  const totalPrice = items.reduce((sum, item) => sum + item.total, 0)

  // Update package with transaction
  const packageData = await prisma.$transaction(async tx => {
    // Delete existing items
    await tx.packageItem.deleteMany({
      where: { packageId: id },
    })

    // Update package with new items
    return tx.package.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description || null,
        category: result.data.category || null,
        isActive: result.data.isActive ?? true,
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
  })

  return packageData
})
