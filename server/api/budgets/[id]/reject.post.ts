// API untuk reject budget
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Alasan penolakan harus diisi'),
})

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Only ADMIN or OWNER can reject
  if (!['ADMIN', 'OWNER'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Hanya Admin/Owner yang dapat menolak budget',
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Budget ID is required' })
  }

  const body = await readBody(event)
  const result = rejectSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.errors[0].message,
    })
  }

  const budget = await prisma.budget.findUnique({ where: { id } })

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
  }

  if (budget.status !== 'PENDING') {
    throw createError({
      statusCode: 400,
      message: 'Hanya budget PENDING yang bisa direject',
    })
  }

  const updatedBudget = await prisma.budget.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedBy: user.id,
      rejectedAt: new Date(),
      rejectionNote: result.data.reason,
    },
    include: {
      customer: true,
      items: true,
    },
  })

  return updatedBudget
})
