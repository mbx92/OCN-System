import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody(event)
  const { productId, actualStock, notes } = body

  if (!productId || actualStock === undefined) {
    throw createError({
      statusCode: 400,
      message: 'Product ID dan actual stock wajib diisi',
    })
  }

  // Get or create stock
  let stock = await prisma.stock.findUnique({
    where: { productId },
    include: { product: true },
  })

  // If stock doesn't exist, create it with 0 quantity
  if (!stock) {
    stock = await prisma.stock.create({
      data: {
        productId,
        quantity: 0,
        reserved: 0,
        available: 0,
      },
      include: { product: true },
    })
  }

  const systemStock = stock.quantity
  const difference = actualStock - systemStock

  // Create stock opname record
  const stockOpname = await prisma.stockOpname.create({
    data: {
      productId,
      systemStock,
      actualStock,
      difference,
      notes: notes || null,
      createdBy: user.id,
    },
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
        },
      },
    },
  })

  // If there's a difference, adjust stock
  if (difference !== 0) {
    // Update stock quantity
    await prisma.stock.update({
      where: { productId },
      data: {
        quantity: actualStock,
        available: stock.available + difference,
      },
    })

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        productId,
        stockId: stock.id,
        type: difference > 0 ? 'OPNAME_IN' : 'OPNAME_OUT',
        quantity: Math.abs(difference),
        reference: `Stock Opname - ${stockOpname.id}`,
        notes: `Adjustment dari stock opname. ${notes || ''}`,
      },
    })
  }

  // Send Telegram notification
  const { notifyStockOpname } = await import('../../utils/telegram')
  await notifyStockOpname({
    productName: stock.product.name,
    productSku: stock.product.sku,
    systemStock,
    actualStock,
    difference,
    unit: stock.product.unit || 'pcs',
    notes: notes || undefined,
  })

  return stockOpname
})
