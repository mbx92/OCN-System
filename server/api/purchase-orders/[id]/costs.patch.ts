import { z } from 'zod'

const updateCostsSchema = z.object({
  shippingCost: z.number().min(0, 'Ongkos kirim tidak boleh negatif').optional(),
  otherCosts: z.number().min(0, 'Biaya lain tidak boleh negatif').optional(),
})

export default defineEventHandler(async event => {
  const poId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!poId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const result = updateCostsSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // At least one field must be provided
  if (result.data.shippingCost === undefined && result.data.otherCosts === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Minimal satu field harus diisi',
    })
  }

  // Get PO to check status
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { 
      status: true,
      subtotal: true,
      shippingCost: true,
      otherCosts: true,
    },
  })

  if (!po) {
    throw createError({
      statusCode: 404,
      statusMessage: 'PO tidak ditemukan',
    })
  }

  // Only allow editing DRAFT and PROGRESS PO (before RECEIVED)
  if (po.status !== 'DRAFT' && po.status !== 'PROGRESS') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Hanya PO dengan status DRAFT atau PROGRESS yang bisa diedit biaya tambahan',
    })
  }

  // Calculate new values
  const newShippingCost = result.data.shippingCost ?? Number(po.shippingCost)
  const newOtherCosts = result.data.otherCosts ?? Number(po.otherCosts)
  const newTotalAmount = Number(po.subtotal) + newShippingCost + newOtherCosts

  // Update PO
  const updatedPo = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      shippingCost: newShippingCost,
      otherCosts: newOtherCosts,
      totalAmount: newTotalAmount,
    },
  })

  return { success: true, data: updatedPo }
})
