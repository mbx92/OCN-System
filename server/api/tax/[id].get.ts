// GET /api/tax/:id - Get single tax payment detail
export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Tax ID is required',
    })
  }

  const taxPayment = await prisma.taxPayment.findUnique({
    where: { id },
    include: {
      cashTransaction: true,
    },
  })

  if (!taxPayment) {
    throw createError({
      statusCode: 404,
      message: 'Tax payment not found',
    })
  }

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

  // Get payment details for this period
  const startDate = new Date(taxPayment.year, taxPayment.month - 1, 1)
  const endDate = new Date(taxPayment.year, taxPayment.month, 0, 23, 59, 59)

  const paymentDetails = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      paidDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      project: {
        select: {
          projectNumber: true,
          title: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { paidDate: 'asc' },
  })

  const dueDate = new Date(taxPayment.dueDate)
  const today = new Date()
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return {
    ...taxPayment,
    period: `${monthNames[taxPayment.month - 1]} ${taxPayment.year}`,
    omzet: Number(taxPayment.omzet),
    taxRate: Number(taxPayment.taxRate),
    taxAmount: Number(taxPayment.taxAmount),
    daysUntilDue,
    isOverdue: daysUntilDue < 0 && taxPayment.status !== 'PAID',
    paymentDetails: paymentDetails.map(p => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      amount: Number(p.amount),
      paidDate: p.paidDate,
      projectNumber: p.project?.projectNumber,
      projectTitle: p.project?.title,
      customerName: p.project?.customer?.name,
    })),
  }
})
