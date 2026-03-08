import { Prisma } from '@prisma/client'

export default defineEventHandler(async event => {
  const query = getQuery(event)

  const pendingItems = await prisma.projectItem.findMany({
    where: {
      poStatus: 'PENDING',
      project: {
        status: { in: ['APPROVED', 'ONGOING'] },
      },
      product: {
        isService: false,
      },
    },
    include: {
      project: {
        select: {
          projectNumber: true,
          title: true,
          customer: { select: { name: true } },
        },
      },
      product: {
        select: {
          sku: true,
          name: true,
          unit: true,
          stock: true,
          suppliers: {
            include: {
              supplier: true,
            },
          },
        },
      },
    },
    orderBy: {
      addedAt: 'desc',
    },
  })

  return pendingItems
})
