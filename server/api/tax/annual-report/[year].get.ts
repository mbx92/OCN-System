// GET /api/tax/annual-report/:year - Annual tax report for SPT
export default defineEventHandler(async event => {
  const year = parseInt(getRouterParam(event, 'year') || '')

  if (!year) {
    throw createError({
      statusCode: 400,
      message: 'Year is required',
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

  // Get all tax payments for the year
  const taxPayments = await prisma.taxPayment.findMany({
    where: { year },
    orderBy: { month: 'asc' },
  })

  // Build monthly data (including months without records)
  const months = []
  let totalOmzet = 0
  let totalTax = 0
  let totalPaid = 0
  let paidCount = 0
  let unpaidCount = 0
  let overdueCount = 0

  for (let m = 1; m <= 12; m++) {
    const taxRecord = taxPayments.find(t => t.month === m)

    if (taxRecord) {
      const omzet = Number(taxRecord.omzet)
      const taxAmount = Number(taxRecord.taxAmount)

      totalOmzet += omzet
      totalTax += taxAmount

      if (taxRecord.status === 'PAID') {
        totalPaid += taxAmount
        paidCount++
      } else if (taxRecord.status === 'OVERDUE') {
        overdueCount++
      } else if (taxRecord.status === 'UNPAID') {
        unpaidCount++
      }

      months.push({
        month: m,
        monthName: monthNames[m - 1],
        omzet,
        taxAmount,
        status: taxRecord.status,
        paymentDate: taxRecord.paymentDate,
        billingCode: taxRecord.billingCode,
      })
    } else {
      // Calculate from payments if no record exists
      const startDate = new Date(year, m - 1, 1)
      const endDate = new Date(year, m, 0, 23, 59, 59)

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
      const taxAmount = Math.round(omzet * 0.005)

      totalOmzet += omzet
      totalTax += taxAmount

      // Only count as unpaid if the month has passed
      const dueDate = new Date(year, m, 15)
      const today = new Date()
      const isPastDue = today > dueDate

      if (omzet > 0 && isPastDue) {
        unpaidCount++
      }

      months.push({
        month: m,
        monthName: monthNames[m - 1],
        omzet,
        taxAmount,
        status: omzet === 0 ? null : isPastDue ? 'NOT_RECORDED' : 'UPCOMING',
        paymentDate: null,
        billingCode: null,
      })
    }
  }

  // Check exemption status
  const isExempted = totalOmzet < 500000000

  return {
    year,
    totalOmzet,
    totalTax,
    totalPaid,
    totalUnpaid: totalTax - totalPaid,
    isExempted,
    months,
    summary: {
      paid: paidCount,
      unpaid: unpaidCount,
      overdue: overdueCount,
      exempted: isExempted ? 12 : 0,
    },
  }
})
