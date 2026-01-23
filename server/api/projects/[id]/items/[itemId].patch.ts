import { z } from 'zod'

const updateItemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi').optional(),
  quantity: z.number().min(1, 'Jumlah minimal 1').optional(),
  unit: z.string().min(1, 'Satuan wajib diisi').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional(),
  cost: z.number().min(0, 'Modal tidak boleh negatif').optional(),
  productId: z.string().optional(),
})

export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const itemId = getRouterParam(event, 'itemId')
  const body = await readBody(event)

  // Get current user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  if (!projectId || !itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const result = updateItemSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Check if item exists and belongs to this project
  const existingItem = await prisma.projectItem.findFirst({
    where: {
      id: itemId,
      projectId,
    },
  })

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item tidak ditemukan',
    })
  }

  // Prepare update data
  const updateData: any = {}

  if (result.data.name !== undefined) updateData.name = result.data.name
  if (result.data.unit !== undefined) updateData.unit = result.data.unit
  if (result.data.cost !== undefined) updateData.cost = result.data.cost
  if (result.data.productId !== undefined) updateData.productId = result.data.productId

  // Handle quantity update
  if (result.data.quantity !== undefined) {
    updateData.quantity = result.data.quantity
    // Recalculate totalCost if cost exists
    const cost = result.data.cost !== undefined ? result.data.cost : existingItem.cost
    updateData.totalCost = cost * result.data.quantity
  }

  // Handle price update
  if (result.data.price !== undefined) {
    updateData.price = result.data.price
    // Recalculate totalPrice
    const quantity =
      result.data.quantity !== undefined ? result.data.quantity : existingItem.quantity
    updateData.totalPrice = result.data.price * quantity
  }

  // If both quantity and price changed, ensure totals are updated
  if (result.data.quantity !== undefined && result.data.price !== undefined) {
    updateData.totalPrice = result.data.price * result.data.quantity
    const cost = result.data.cost !== undefined ? result.data.cost : existingItem.cost
    updateData.totalCost = cost * result.data.quantity
  }

  // Update the item
  const updatedItem = await prisma.projectItem.update({
    where: { id: itemId },
    data: updateData,
  })

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'UPDATE_PROJECT_ITEM',
      entity: 'ProjectItem',
      entityId: itemId,
      metadata: {
        projectId,
        itemName: updatedItem.name,
        changes: updateData,
      },
      ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
    },
  })

  return {
    success: true,
    item: updatedItem,
  }
})
