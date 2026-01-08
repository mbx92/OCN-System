export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      project: {
        select: {
          id: true,
          projectNumber: true,
          title: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      },
      items: {
        include: {
          product: true,
          projectItem: true,
        },
      },
    },
  })

  if (!purchaseOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Purchase Order tidak ditemukan',
    })
  }

  // Untuk setiap PO item, cari semua project items yang di-group berdasarkan productId
  const itemsWithGroupedProjects = await Promise.all(
    purchaseOrder.items.map(async item => {
      if (item.productId) {
        // Find all project items dengan product yang sama (tidak peduli harga) dan status ORDERED
        const groupedProjectItems = await prisma.projectItem.findMany({
          where: {
            productId: item.productId,
            poStatus: 'ORDERED',
            needsPo: true,
          },
          include: {
            project: {
              select: {
                id: true,
                projectNumber: true,
                title: true,
              },
            },
          },
        })

        return {
          ...item,
          groupedProjectItems,
        }
      }
      return {
        ...item,
        groupedProjectItems: item.projectItem ? [item.projectItem] : [],
      }
    })
  )

  return {
    ...purchaseOrder,
    items: itemsWithGroupedProjects,
  }
})
