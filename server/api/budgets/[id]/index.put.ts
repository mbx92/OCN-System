// API untuk UPDATE budget
import { z } from 'zod'
import dayjs from 'dayjs'

const budgetItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().nullable(),
  name: z.string().min(1, 'Nama item harus diisi'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  quantity: z.number().min(1).default(1),
  unit: z.string().default('pcs'),
  costPrice: z.number().min(0, 'Harga modal harus >= 0'),
  sellPrice: z.number().min(0, 'Harga jual harus >= 0'),
  saveAsProduct: z.boolean().optional().default(false),
})

const updateBudgetSchema = z.object({
  customerId: z.string().optional().nullable(),
  title: z.string().min(1, 'Judul budget harus diisi'),
  description: z.string().optional().nullable(),
  items: z.array(budgetItemSchema).min(1, 'Minimal 1 item'),
  notes: z.string().optional().nullable(),
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

  // Check if budget exists and is still DRAFT
  const existing = await prisma.budget.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
  }

  const body = await readBody(event)

  // Allow status and quotationId updates for non-DRAFT budgets (for conversion)
  if (body.status === 'CONVERTED' && body.quotationId) {
    const budget = await prisma.budget.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        quotationId: body.quotationId,
      },
      include: {
        customer: true,
        items: {
          orderBy: { id: 'asc' },
        },
      },
    })
    return budget
  }

  if (existing.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      message: 'Hanya budget dengan status DRAFT yang dapat diedit',
    })
  }
  const result = updateBudgetSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const now = dayjs()

  // Helper to generate SKU
  const generateSKU = (category: string): string => {
    const dateStr = now.format('YYYYMMDD')
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    const cat = (category || 'UNC').substring(0, 3).toUpperCase()
    return `${cat}-${dateStr}-${random}`
  }

  // Process items and create products if needed
  const processedItems = []
  for (const item of result.data.items) {
    let productId = item.productId || null

    // If saveAsProduct is true and no productId, create new product
    if (item.saveAsProduct && !productId) {
      const category = item.category || 'Uncategorized'
      const sku = generateSKU(category)

      // Create new product
      const newProduct = await prisma.product.create({
        data: {
          sku,
          name: item.name,
          category,
          unit: item.unit,
          purchasePrice: item.costPrice,
          sellingPrice: item.sellPrice,
          type: 'PRODUCT',
        },
      })

      // Create stock record for new product
      await prisma.stock.create({
        data: {
          productId: newProduct.id,
          quantity: 0,
          reserved: 0,
          available: 0,
        },
      })

      productId = newProduct.id
    }

    processedItems.push({
      productId,
      name: item.name,
      description: item.description || null,
      category: item.category || null,
      quantity: item.quantity,
      unit: item.unit,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice,
      totalCost: item.quantity * item.costPrice,
      totalPrice: item.quantity * item.sellPrice,
      margin: item.quantity * item.sellPrice - item.quantity * item.costPrice,
      saveAsProduct: item.saveAsProduct || false,
    })
  }

  // Calculate totals
  const totalCost = processedItems.reduce((sum, i) => sum + i.totalCost, 0)
  const totalPrice = processedItems.reduce((sum, i) => sum + i.totalPrice, 0)
  const marginAmount = totalPrice - totalCost
  const marginPercent = totalCost > 0 ? (marginAmount / totalCost) * 100 : 0

  // Delete existing items and create new ones (simpler than upsert for this case)
  await prisma.budgetItem.deleteMany({
    where: { budgetId: id },
  })

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      customerId: result.data.customerId || null,
      title: result.data.title,
      description: result.data.description || null,
      totalCost,
      totalPrice,
      marginAmount,
      marginPercent,
      notes: result.data.notes || null,
      items: {
        create: processedItems,
      },
    },
    include: {
      customer: true,
      items: {
        orderBy: { id: 'asc' },
      },
    },
  })

  return budget
})
