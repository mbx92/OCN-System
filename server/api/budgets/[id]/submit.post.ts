// API untuk submit budget untuk approval
import { z } from 'zod'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Budget ID is required' })
  }

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })
  }

  if (budget.status !== 'DRAFT') {
    throw createError({
      statusCode: 400,
      message: 'Hanya budget DRAFT yang bisa disubmit untuk approval',
    })
  }

  if (budget.items.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Budget harus memiliki minimal 1 item',
    })
  }

  const updatedBudget = await prisma.budget.update({
    where: { id },
    data: {
      status: 'PENDING',
    },
    include: {
      customer: true,
      items: true,
    },
  })

  return updatedBudget
})
