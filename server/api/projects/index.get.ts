export default defineEventHandler(async event => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const status = query.status as string
  const search = query.search as string

  const where: any = {}

  if (status && status !== 'all') {
    where.status = status
  } else {
    // When status is 'all' or not provided, exclude CANCELLED projects
    where.status = { not: 'CANCELLED' }
  }

  if (search) {
    where.OR = [
      { projectNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        customer: true,
        items: {
          select: {
            id: true,
            totalPrice: true,
            totalCost: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            type: true,
            paymentDate: true,
          },
        },
        _count: {
          select: { payments: true, expenses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  // Calculate paid amount and remaining amount for each project
  const projectsWithPaymentInfo = projects.map(project => {
    const totalPrice =
      project.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0) ||
      Number(project.finalPrice) ||
      Number(project.budget) ||
      0

    const paidAmount = project.payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )

    const remainingAmount = totalPrice - paidAmount

    return {
      ...project,
      totalAmount: totalPrice,
      paidAmount,
      remainingAmount,
    }
  })

  return {
    data: projectsWithPaymentInfo,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
