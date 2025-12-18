import { Prisma } from '@prisma/client'

export default defineEventHandler(async event => {
  const query = getQuery(event)

  // Filter by project status if needed, but 'needsPo' should suffice?
  // Usually we only care about Approved/Ongoing projects.

  const pendingItems = await prisma.projectItem.findMany({
    where: {
      needsPo: true,
      poStatus: 'PENDING',
      project: {
        status: { in: ['APPROVED', 'ONGOING'] },
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
