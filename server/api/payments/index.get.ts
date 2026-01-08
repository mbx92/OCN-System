export default defineEventHandler(async event => {
  const query = getQuery(event) as {
    mode?: string
    status?: string
    page?: string
    limit?: string
  }

  const mode = query.mode // PROJECT or POS
  const status = query.status // PENDING, UNPAID, PARTIAL, PAID, OVERDUE, CANCELLED
  const page = parseInt(query.page || '1')
  const limit = parseInt(query.limit || '20')
  const skip = (page - 1) * limit

  const where: any = {}
  if (mode) {
    where.mode = mode
  }
  if (status) {
    where.status = status
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            title: true,
            status: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])

  return {
    data: payments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
