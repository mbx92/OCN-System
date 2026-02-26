// POST /api/tax/auto-generate - Auto generate tax records for missing periods
export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { fromYear, fromMonth, toYear, toMonth } = body

  if (!fromYear || !fromMonth || !toYear || !toMonth) {
    throw createError({
      statusCode: 400,
      message: 'fromYear, fromMonth, toYear, toMonth are required',
    })
  }

  const generated: any[] = []
  const skipped: any[] = []

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

  let currentYear = fromYear
  let currentMonth = fromMonth

  while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMonth)) {
    // Check if already exists
    const existing = await prisma.taxPayment.findUnique({
      where: { year_month: { year: currentYear, month: currentMonth } },
    })

    if (existing) {
      skipped.push({
        year: currentYear,
        month: currentMonth,
        period: `${monthNames[currentMonth - 1]} ${currentYear}`,
        reason: 'Already exists',
      })
    } else {
      // Calculate omzet
      const startDate = new Date(currentYear, currentMonth - 1, 1)
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)

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
      const taxRate = 0.005
      const taxAmount = Math.round(omzet * taxRate)
      const dueDate = new Date(currentYear, currentMonth, 15)

      // Determine status
      const today = new Date()
      let status: 'UNPAID' | 'OVERDUE' | 'EXEMPTED' = 'UNPAID'

      // Check yearly exemption
      const yearlyOmzet = await getYearlyOmzet(currentYear)
      if (yearlyOmzet < 500000000) {
        status = 'EXEMPTED'
      } else if (today > dueDate) {
        status = 'OVERDUE'
      }

      // Only create if there's omzet
      if (omzet > 0) {
        const created = await prisma.taxPayment.create({
          data: {
            year: currentYear,
            month: currentMonth,
            omzet,
            taxRate,
            taxAmount,
            dueDate,
            status,
          },
        })

        generated.push({
          id: created.id,
          year: currentYear,
          month: currentMonth,
          period: `${monthNames[currentMonth - 1]} ${currentYear}`,
          omzet,
          taxAmount,
          status,
        })
      } else {
        skipped.push({
          year: currentYear,
          month: currentMonth,
          period: `${monthNames[currentMonth - 1]} ${currentYear}`,
          reason: 'No omzet',
        })
      }
    }

    // Move to next month
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }

  return {
    success: true,
    generated,
    skipped,
    summary: {
      generatedCount: generated.length,
      skippedCount: skipped.length,
    },
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
