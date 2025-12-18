export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      quotations: {
        orderBy: { createdAt: 'desc' },
      },
      items: {
        include: { product: true },
        orderBy: { addedAt: 'desc' },
      },
      expenses: {
        orderBy: { date: 'desc' },
      },
      payments: {
        orderBy: { dueDate: 'asc' },
      },
      purchaseOrders: {
        include: { supplier: true },
        orderBy: { createdAt: 'desc' },
      },
      technicians: {
        include: { technician: true },
      },
      warranties: {
        orderBy: { endDate: 'asc' },
      },
      financialSummary: true,
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  return project
})
