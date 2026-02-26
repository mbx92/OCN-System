// POST /api/tax - Record tax payment for a period
export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { year, month, billingCode, notes } = body

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
    throw createError({
      statusCode: 400,
      message: 'Tax record already exists for this period',
    })
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

  // Check if exempted (annual omzet < 500jt)
  const yearlyOmzet = await getYearlyOmzet(year)
  const isExempted = yearlyOmzet < 500000000

  // Determine status
  let status: 'UNPAID' | 'EXEMPTED' | 'OVERDUE' = 'UNPAID'
  if (isExempted) {
    status = 'EXEMPTED'
  } else if (new Date() > dueDate) {
    status = 'OVERDUE'
  }

  const taxPayment = await prisma.taxPayment.create({
    data: {
      year,
      month,
      omzet,
      taxRate,
      taxAmount,
      dueDate,
      status,
      billingCode,
      notes,
    },
  })

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
    ...taxPayment,
    period: `${monthNames[month - 1]} ${year}`,
    omzet: Number(taxPayment.omzet),
    taxRate: Number(taxPayment.taxRate),
    taxAmount: Number(taxPayment.taxAmount),
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
