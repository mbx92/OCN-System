// GET /api/tax/calculate/:year/:month - Calculate tax for a period (preview)
export default defineEventHandler(async event => {
  const year = parseInt(getRouterParam(event, 'year') || '')
  const month = parseInt(getRouterParam(event, 'month') || '')

  if (!year || !month || month < 1 || month > 12) {
    throw createError({
      statusCode: 400,
      message: 'Invalid year or month',
    })
  }

  // Check if already exists
  const existing = await prisma.taxPayment.findUnique({
    where: { year_month: { year, month } },
  })

  if (existing) {
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

    const dueDate = new Date(existing.dueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      exists: true,
      id: existing.id,
      year: existing.year,
      month: existing.month,
      period: `${monthNames[existing.month - 1]} ${existing.year}`,
      omzet: Number(existing.omzet),
      taxRate: Number(existing.taxRate),
      taxAmount: Number(existing.taxAmount),
      dueDate: existing.dueDate,
      status: existing.status,
      daysUntilDue,
      isOverdue: daysUntilDue < 0 && existing.status !== 'PAID',
      paymentDate: existing.paymentDate,
    }
  }

  // Calculate omzet from payments
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const payments = await prisma.payment.aggregate({
    where: {
      status: 'PAID',
      paidDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amount: true },
  })

  const omzet = Number(payments._sum.amount || 0)
  const taxRate = 0.005 // 0.5%
  const taxAmount = Math.round(omzet * taxRate)

  // Due date is 15th of next month
  const dueDate = new Date(year, month, 15)

  const today = new Date()
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Check if exempted (annual omzet < 500jt)
  const yearlyOmzet = await getYearlyOmzet(year)
  const isExempted = yearlyOmzet < 500000000

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

  return {
    exists: false,
    year,
    month,
    period: `${monthNames[month - 1]} ${year}`,
    omzet,
    taxRate,
    taxAmount,
    dueDate,
    status: isExempted ? 'EXEMPTED' : 'UNPAID',
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isExempted,
    yearlyOmzet,
  }
})

async function getYearlyOmzet(year: number): Promise<number> {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const payments = await prisma.payment.aggregate({
    where: {
      status: 'PAID',
      paidDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amount: true },
  })

  return Number(payments._sum.amount || 0)
}
