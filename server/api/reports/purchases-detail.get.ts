import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month'
  const periodValue = query.periodValue ? parseInt(query.periodValue as string) : null

  try {
    // Calculate date range
    let startDate: Date
    let endDate: Date

    if (period === 'month' && periodValue) {
      startDate = new Date(year, periodValue - 1, 1)
      endDate = new Date(year, periodValue, 0, 23, 59, 59, 999)
    } else if (period === 'quarter' && periodValue) {
      const quarterStartMonth = (periodValue - 1) * 3
      startDate = new Date(year, quarterStartMonth, 1)
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    // Get detailed data
    const [purchaseOrders, assets] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: {
          receivedDate: { gte: startDate, lte: endDate },
          status: 'RECEIVED',
        },
        include: {
          supplier: true,
          project: { select: { projectNumber: true, title: true } },
          items: true,
        },
        orderBy: { receivedDate: 'desc' },
      }),
      prisma.asset.findMany({
        where: {
          purchaseDate: { gte: startDate, lte: endDate },
        },
        orderBy: { purchaseDate: 'desc' },
      }),
    ])

    // Format PO data
    const poItems = purchaseOrders.map(po => ({
      id: po.id,
      type: 'PO' as const,
      reference: po.poNumber,
      description: `${po.items.length} item(s) - ${po.notes || 'Purchase Order'}`,
      category: 'Purchase Order',
      supplier: po.supplier.name,
      amount: Number(po.totalAmount),
      date: po.receivedDate?.toISOString() || po.createdAt.toISOString(),
      status: po.status,
      projectNumber: po.project?.projectNumber,
      projectTitle: po.project?.title,
    }))

    // Format Asset data
    const assetItems = assets.map(asset => ({
      id: asset.id,
      type: 'ASSET' as const,
      reference: asset.assetNumber,
      description: asset.name,
      category: asset.category,
      supplier: null,
      amount: Number(asset.purchasePrice),
      date: asset.purchaseDate.toISOString(),
      status: asset.status,
      projectNumber: null,
      projectTitle: null,
    }))

    // Combine and sort by date
    const items = [...poItems, ...assetItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Calculate totals
    const totals = {
      poTotal: poItems.reduce((sum, p) => sum + p.amount, 0),
      assetTotal: assetItems.reduce((sum, a) => sum + a.amount, 0),
      total: items.reduce((sum, i) => sum + i.amount, 0),
      poCount: poItems.length,
      assetCount: assetItems.length,
    }

    return {
      items,
      totals,
      period,
      periodValue,
      year,
    }
  } catch (error: any) {
    console.error('Error generating purchases detail:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate purchases detail',
    })
  }
})
