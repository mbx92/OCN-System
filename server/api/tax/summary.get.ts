// GET /api/tax/summary - Get tax summary for dashboard
export default defineEventHandler(async () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1

  // Get all tax payments for current year
  const yearlyTaxes = await prisma.taxPayment.findMany({
    where: { year: currentYear },
    orderBy: { month: 'asc' },
  })

  // Calculate yearly omzet
  const startOfYear = new Date(currentYear, 0, 1)
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59)

  const yearlyPayments = await prisma.payment.aggregate({
    where: {
      status: 'PAID',
      paidDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    _sum: { amount: true },
  })

  const totalOmzet = Number(yearlyPayments._sum.amount || 0)
  const isExempted = totalOmzet < 500000000

  // Calculate totals
  let totalTax = 0
  let totalPaid = 0
  let paidCount = 0
  let unpaidCount = 0
  let overdueCount = 0

  for (const tax of yearlyTaxes) {
    const amount = Number(tax.taxAmount)
    totalTax += amount

    if (tax.status === 'PAID') {
      totalPaid += amount
      paidCount++
    } else if (tax.status === 'OVERDUE') {
      overdueCount++
    } else if (tax.status === 'UNPAID') {
      unpaidCount++
    }
  }

  // Get current month tax
  const currentMonthTax = yearlyTaxes.find(t => t.month === currentMonth)

  // Get upcoming due dates
  const upcomingTaxes = await prisma.taxPayment.findMany({
    where: {
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    orderBy: { dueDate: 'asc' },
    take: 3,
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
    currentYear,
    totalOmzet,
    isExempted,
    totalTax,
    totalPaid,
    totalUnpaid: totalTax - totalPaid,
    counts: {
      paid: paidCount,
      unpaid: unpaidCount,
      overdue: overdueCount,
    },
    currentMonth: currentMonthTax
      ? {
          period: `${monthNames[currentMonthTax.month - 1]} ${currentMonthTax.year}`,
          taxAmount: Number(currentMonthTax.taxAmount),
          status: currentMonthTax.status,
          dueDate: currentMonthTax.dueDate,
        }
      : null,
    upcoming: upcomingTaxes.map(t => ({
      id: t.id,
      period: `${monthNames[t.month - 1]} ${t.year}`,
      taxAmount: Number(t.taxAmount),
      dueDate: t.dueDate,
      status: t.status,
      daysUntilDue: Math.ceil(
        (new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
  }
})
