import dayjs from 'dayjs'

export default defineEventHandler(async () => {
  const alerts: { id: string; type: string; message: string }[] = []
  const today = new Date()
  const thirtyDaysFromNow = dayjs().add(30, 'day').toDate()

  // Low stock alerts
  const lowStock = await prisma.stock.findMany({
    where: {
      product: { minStock: { gt: 0 } },
      available: { lte: 5 },
    },
    include: { product: true },
    take: 5,
  })

  lowStock.forEach(stock => {
    if (stock.available <= stock.product.minStock) {
      alerts.push({
        id: `stock-${stock.id}`,
        type: 'warning',
        message: `Stok ${stock.product.name} rendah (${stock.available} tersisa)`,
      })
    }
  })

  // Expiring warranties
  const expiringWarranties = await prisma.warranty.findMany({
    where: {
      status: 'ACTIVE',
      endDate: {
        gte: today,
        lte: thirtyDaysFromNow,
      },
      project: {
        status: { not: 'CANCELLED' },
      },
    },
    include: {
      project: {
        include: { customer: true },
      },
    },
    take: 5,
  })

  expiringWarranties.forEach(warranty => {
    const daysLeft = dayjs(warranty.endDate).diff(today, 'day')
    alerts.push({
      id: `warranty-${warranty.id}`,
      type: 'info',
      message: `Garansi proyek ${warranty.project?.projectNumber || ''} berakhir dalam ${daysLeft} hari`,
    })
  })

  // Projects pending approval
  const pendingProjects = await prisma.project.count({
    where: { status: 'APPROVED' },
  })

  if (pendingProjects > 0) {
    alerts.push({
      id: 'pending-projects',
      type: 'info',
      message: `${pendingProjects} proyek menunggu untuk dikerjakan`,
    })
  }

  // PO items pending
  const pendingPoItems = await prisma.projectItem.count({
    where: { poStatus: 'PENDING' },
  })

  if (pendingPoItems > 0) {
    alerts.push({
      id: 'pending-po',
      type: 'warning',
      message: `${pendingPoItems} item menunggu PO`,
    })
  }

  return alerts.slice(0, 10)
})
