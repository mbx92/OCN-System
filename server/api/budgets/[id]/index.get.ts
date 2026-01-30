// API untuk GET budget detail
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
})
