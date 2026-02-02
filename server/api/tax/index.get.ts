// GET /api/tax - List tax payments with filters
export default defineEventHandler(async event => {
  const query = getQuery(event) as {
    year?: string
    status?: string
    page?: string
    limit?: string
  }

  const year = query.year ? parseInt(query.year) : undefined
  const status = query.status
  const page = parseInt(query.page || '1')
  const limit = parseInt(query.limit || '12')
  const skip = (page - 1) * limit

  const where: any = {}
  if (year) {
    where.year = year
  }
  if (status) {
    where.status = status
  }

  const [taxPayments, total] = await Promise.all([
    prisma.taxPayment.findMany({
      where,
      include: {
        cashTransaction: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.taxPayment.count({ where }),
  ])

  // Format data dengan nama bulan
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const formattedData = taxPayments.map(tax => ({
    ...tax,
    period: `${monthNames[tax.month - 1]} ${tax.year}`,
    omzet: Number(tax.omzet),
    taxRate: Number(tax.taxRate),
    taxAmount: Number(tax.taxAmount),
  }))

  return {
    data: formattedData,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
})
