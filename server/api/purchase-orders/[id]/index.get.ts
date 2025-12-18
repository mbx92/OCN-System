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

  return purchaseOrder
})
