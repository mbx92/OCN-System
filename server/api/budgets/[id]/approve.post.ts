// API untuk approve budget
import { z } from 'zod'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Only ADMIN or OWNER can approve
  if (!['ADMIN', 'OWNER'].includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Hanya Admin/Owner yang dapat menyetujui budget',
    })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Budget ID is required' })
  }

  const budget = await prisma.budget.findUnique({ where: { id } })

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
  }

  if (budget.status !== 'PENDING') {
    throw createError({
      statusCode: 400,
      message: 'Hanya budget PENDING yang bisa diapprove',
    })
  }

  const updatedBudget = await prisma.budget.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedBy: user.id,
      approvedAt: new Date(),
    },
    include: {
      customer: true,
      items: true,
    },
  })

  return updatedBudget
})
