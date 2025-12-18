export default defineEventHandler(async () => {
  const technicians = await prisma.technician.findMany({
    include: {
      user: {
        select: {
          username: true,
          email: true,
          isActive: true,
        },
      },
      assignments: {
        where: {
          project: {
            status: { in: ['APPROVED', 'IN_PROGRESS'] },
          },
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Calculate total earnings for each technician
  const techsWithEarnings = await Promise.all(
    technicians.map(async t => {
      const earnings = await prisma.projectTechnician.aggregate({
        where: {
          technicianId: t.id,
          project: { status: 'COMPLETED' },
        },
        _sum: { feeAmount: true },
      })

      return {
        ...t,
        username: t.user?.username || null,
        email: t.user?.email || null,
        isActive: t.user?.isActive ?? true,
        activeProjects: t.assignments.length,
        totalProjects: t._count.assignments,
        totalEarnings: earnings._sum.feeAmount || 0,
      }
    })
  )

  return techsWithEarnings
})
