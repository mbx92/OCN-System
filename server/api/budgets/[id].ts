// API untuk detail, update, delete budget
import { z } from 'zod'
import dayjs from 'dayjs'

const budgetItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  quantity: z.number().min(1).default(1),
  unit: z.string().default('pcs'),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  saveAsProduct: z.boolean().optional().default(false),
})

const updateBudgetSchema = z.object({
  customerId: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  items: z.array(budgetItemSchema).optional(),
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

  const method = event.method

  // GET - Get budget detail
  if (method === 'GET') {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          orderBy: { id: 'asc' },
        },
        quotation: {
          select: { id: true, quotationNo: true, status: true },
        },
      },
    })

    if (!budget) {
      throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
    }

    return budget
  }

  // PUT - Update budget
  if (method === 'PUT') {
    const existingBudget = await prisma.budget.findUnique({ where: { id } })

    if (!existingBudget) {
      throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
    }

    if (!['DRAFT', 'REJECTED'].includes(existingBudget.status)) {
      throw createError({
        statusCode: 400,
        message: 'Hanya budget DRAFT atau REJECTED yang bisa diedit',
      })
    }

    const body = await readBody(event)
    const result = updateBudgetSchema.safeParse(body)

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: result.error.errors[0].message,
      })
    }

    const updateData: any = {
      customerId: result.data.customerId ?? existingBudget.customerId,
      title: result.data.title ?? existingBudget.title,
      description: result.data.description ?? existingBudget.description,
      notes: result.data.notes ?? existingBudget.notes,
    }

    // If rejected, set back to draft
    if (existingBudget.status === 'REJECTED') {
      updateData.status = 'DRAFT'
      updateData.rejectedBy = null
      updateData.rejectedAt = null
      updateData.rejectionNote = null
    }

    // If items are provided, recalculate
    if (result.data.items && result.data.items.length > 0) {
      // Delete existing items
      await prisma.budgetItem.deleteMany({ where: { budgetId: id } })

      // Helper to generate SKU
      const now = dayjs()
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
          budgetId: id,
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

      await prisma.budgetItem.createMany({ data: processedItems })

      // Calculate totals
      const totalCost = processedItems.reduce((sum, i) => sum + i.totalCost, 0)
      const totalPrice = processedItems.reduce((sum, i) => sum + i.totalPrice, 0)
      const marginAmount = totalPrice - totalCost
      const marginPercent = totalCost > 0 ? (marginAmount / totalCost) * 100 : 0

      updateData.totalCost = totalCost
      updateData.totalPrice = totalPrice
      updateData.marginAmount = marginAmount
      updateData.marginPercent = marginPercent
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    })

    return budget
  }

  // DELETE - Delete budget
  if (method === 'DELETE') {
    const existingBudget = await prisma.budget.findUnique({ where: { id } })

    if (!existingBudget) {
      throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
    }

    if (!['DRAFT', 'REJECTED'].includes(existingBudget.status)) {
      throw createError({
        statusCode: 400,
        message: 'Hanya budget DRAFT atau REJECTED yang bisa dihapus',
      })
    }

    await prisma.budget.delete({ where: { id } })

    return { success: true, message: 'Budget berhasil dihapus' }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
