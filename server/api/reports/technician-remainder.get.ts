import { H3Event } from 'h3'

// GET /api/reports/technician-remainder
// Returns the total "sisa upah teknisi" (unallocated technician wages saved to kas)
// for a given period.
//
// Params:
//   year        - full year, e.g. 2026
//   period      - 'month' | 'quarter' | 'year'
//   periodValue - month (1-12) or quarter (1-4) number; ignored when period='year'
export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month'
  const periodValue = query.periodValue ? parseInt(query.periodValue as string) : null

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

  let startDate: Date
  let endDate: Date
  let periodLabel: string

  if (period === 'month' && periodValue) {
    startDate = new Date(year, periodValue - 1, 1)
    endDate = new Date(year, periodValue, 0, 23, 59, 59, 999)
    periodLabel = `${monthNames[periodValue - 1]} ${year}`
  } else if (period === 'quarter' && periodValue) {
    const quarterStartMonth = (periodValue - 1) * 3
    startDate = new Date(year, quarterStartMonth, 1)
    endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
    periodLabel = `Kuartal ${periodValue} ${year}`
  } else {
    startDate = new Date(year, 0, 1)
    endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    periodLabel = `Tahun ${year}`
  }

  try {
    const transactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'INCOME',
        date: {
          gte: startDate,
          lte: endDate,
        },
        description: {
          contains: 'Sisa upah teknisi',
        },
      },
      orderBy: { date: 'asc' },
    })

    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      periodLabel,
      total,
      count: transactions.length,
      items: transactions.map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description,
        reference: t.reference,
        referenceId: t.referenceId,
      })),
    }
  } catch (error: any) {
    console.error('Error fetching technician remainder data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch technician remainder data',
    })
  }
})
