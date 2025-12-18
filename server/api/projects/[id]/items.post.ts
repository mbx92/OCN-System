import { z } from 'zod'

const itemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  quantity: z.number().min(1, 'Jumlah minimal 1'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  cost: z.number().min(0, 'Modal tidak boleh negatif').optional(),
  type: z.string().default('ADDITIONAL'),
  productId: z.string().optional(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const result = itemSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { name, quantity, unit, price, type, productId } = result.data

  // Determine cost
  let cost = 0 // Default to 0

  if (result.data.cost !== undefined) {
    // If cost is explicitly provided (e.g. from manual input), use it
    cost = result.data.cost
  } else if (productId) {
    // If product is selected and no cost provided, try fetching from master
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { purchasePrice: true },
    })
    if (product) {
      cost = Number(product.purchasePrice)
    }
  } else {
    // Fallback for manual items without explicit cost -> could default to 0 or price
    // Changing default to 0 to avoid false high costs if user forgets,
    // or keep as price? User complained about logic.
    // Let's default to 0 if not provided, assuming they will input it now.
    // Actually, maintaining 'cost = price' for manual items was the previous logic that might have confused them.
    // SAFE BET: Default to 0 unless specified.
    cost = 0
  }

  const item = await prisma.projectItem.create({
    data: {
      projectId: id,
      name,
      quantity,
      unit,
      price,
      totalPrice: price * quantity,
      cost,
      totalCost: cost * quantity,
      type,
      productId: productId || null,
    },
  })

  // Update actual cost of project
  await prisma.project.update({
    where: { id },
    data: {
      actualCost: {
        increment: item.totalPrice,
      },
    },
  })

  // Reserve stock for items with productId
  if (productId) {
    // Get stock to link movement and calculate new values
    const stock = await prisma.stock.findUnique({
      where: { productId },
    })

    if (stock) {
      const newReserved = stock.reserved + quantity
      const newAvailable = stock.quantity - newReserved

      // Update stock with new reserved and recalculated available
      await prisma.stock.update({
        where: { productId },
        data: {
          reserved: newReserved,
          available: newAvailable,
        },
      })

      // Record stock movement
      await prisma.stockMovement.create({
        data: {
          productId,
          stockId: stock.id,
          type: 'RESERVE',
          quantity: quantity,
          reference: id,
          notes: `Reserved for project item: ${name}`,
        },
      })
    }
  }

  return item
})
