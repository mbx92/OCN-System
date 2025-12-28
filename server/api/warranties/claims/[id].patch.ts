export default defineEventHandler(async event => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID klaim tidak valid',
    })
  }

  const existing = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: {
      warranty: true,
    },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Klaim tidak ditemukan',
    })
  }

  const { status, resolution } = body

  const updateData: any = {}

  if (status !== undefined) updateData.status = status
  if (resolution !== undefined) updateData.resolution = resolution

  // Auto-set resolvedDate when status is RESOLVED or REJECTED
  if (status === 'RESOLVED' || status === 'REJECTED') {
    updateData.resolvedDate = new Date()

    // If claim is resolved/rejected and no other pending claims, set warranty back to ACTIVE
    const pendingClaims = await prisma.warrantyClaim.count({
      where: {
        warrantyId: existing.warrantyId,
        id: { not: id },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    })

    if (pendingClaims === 0) {
      await prisma.warranty.update({
        where: { id: existing.warrantyId },
        data: { status: 'ACTIVE' },
      })
    }
  }

  const claim = await prisma.warrantyClaim.update({
    where: { id },
    data: updateData,
    include: {
      warranty: {
        include: {
          project: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  })

  return claim
})
