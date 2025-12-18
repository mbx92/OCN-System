export default defineEventHandler(async () => {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      project: {
        select: {
          id: true,
          projectNumber: true,
          title: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return purchaseOrders
})
