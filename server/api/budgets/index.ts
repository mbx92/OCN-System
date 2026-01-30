// API untuk list dan create budget
import { z } from 'zod'
import dayjs from 'dayjs'

const budgetItemSchema = z.object({
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

const createBudgetSchema = z.object({
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

  const method = event.method

  // GET - List budgets
  if (method === 'GET') {
    const query = getQuery(event)
    const { status, search, page = 1, limit = 10 } = query

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { budgetNumber: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { customer: { name: { contains: search as string, mode: 'insensitive' } } },
      ]
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, companyName: true },
          },
          items: true,
          quotation: {
            select: { id: true, quotationNo: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.budget.count({ where }),
    ])

    return {
      data: budgets,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    }
  }

  // POST - Create budget
  if (method === 'POST') {
    const body = await readBody(event)
    const result = createBudgetSchema.safeParse(body)

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error.errors[0].message,
      })
    }

    // Generate budget number
    const now = dayjs()
    const startOfMonth = now.startOf('month').toDate()
    const endOfMonth = now.endOf('month').toDate()
    const count = await prisma.budget.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    })
    const budgetNumber = `BDG-${now.format('YYYYMM')}-${String(count + 1).padStart(3, '0')}`

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

    const budget = await prisma.budget.create({
      data: {
        budgetNumber,
        customerId: result.data.customerId || null,
        title: result.data.title,
        description: result.data.description || null,
        totalCost,
        totalPrice,
        marginAmount,
        marginPercent,
        notes: result.data.notes || null,
        createdBy: user.id,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    })

    return budget
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
