import { H3Event } from 'h3'

interface PurchaseItem {
  id: string
  type: 'PO' | 'ASSET'
  reference: string
  description: string
  category: string
  supplier?: string
  amount: number
  date: string
  status: string
  projectNumber?: string
}

interface PurchaseSummary {
  period: string
  periodValue: number
  periodLabel: string
  poTotal: number
  assetTotal: number
  total: number
  poCount: number
  assetCount: number
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month'
  const category = query.category as string // 'PO', 'ASSET', or empty for all

  try {
    const summaries: PurchaseSummary[] = []
    const monthNamesShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]

    const generatePeriodData = async (startDate: Date, endDate: Date) => {
      const [poData, assetData] = await Promise.all([
        // Get Purchase Orders (only RECEIVED status)
        prisma.purchaseOrder.findMany({
          where: {
            receivedDate: { gte: startDate, lte: endDate },
            status: 'RECEIVED',
          },
          include: {
            supplier: true,
            project: { select: { projectNumber: true } },
          },
        }),
        // Get Assets
        prisma.asset.findMany({
          where: {
            purchaseDate: { gte: startDate, lte: endDate },
          },
        }),
      ])

      const poTotal = poData.reduce((sum, po) => sum + Number(po.totalAmount), 0)
      const assetTotal = assetData.reduce((sum, a) => sum + Number(a.purchasePrice), 0)

      return {
        poTotal,
        assetTotal,
        total: poTotal + assetTotal,
        poCount: poData.length,
        assetCount: assetData.length,
        poData,
        assetData,
      }
    }

    if (period === 'month') {
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)
        const data = await generatePeriodData(startDate, endDate)

        summaries.push({
          period: 'month',
          periodValue: month,
          periodLabel: monthNamesShort[month - 1],
          poTotal: data.poTotal,
          assetTotal: data.assetTotal,
          total: data.total,
          poCount: data.poCount,
          assetCount: data.assetCount,
        })
      }
    } else if (period === 'quarter') {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterStartMonth = (quarter - 1) * 3
        const startDate = new Date(year, quarterStartMonth, 1)
        const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
        const data = await generatePeriodData(startDate, endDate)

        summaries.push({
          period: 'quarter',
          periodValue: quarter,
          periodLabel: `Q${quarter}`,
          poTotal: data.poTotal,
          assetTotal: data.assetTotal,
          total: data.total,
          poCount: data.poCount,
          assetCount: data.assetCount,
        })
      }
    } else {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      const data = await generatePeriodData(startDate, endDate)

      summaries.push({
        period: 'year',
        periodValue: year,
        periodLabel: `Tahun ${year}`,
        poTotal: data.poTotal,
        assetTotal: data.assetTotal,
        total: data.total,
        poCount: data.poCount,
        assetCount: data.assetCount,
      })
    }

    // Calculate totals
    const totals = {
      poTotal: summaries.reduce((sum, s) => sum + s.poTotal, 0),
      assetTotal: summaries.reduce((sum, s) => sum + s.assetTotal, 0),
      total: summaries.reduce((sum, s) => sum + s.total, 0),
      poCount: summaries.reduce((sum, s) => sum + s.poCount, 0),
      assetCount: summaries.reduce((sum, s) => sum + s.assetCount, 0),
    }

    return {
      year,
      period,
      summaries,
      totals,
    }
  } catch (error: any) {
    console.error('Error generating purchases report:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate purchases report',
    })
  }
})
