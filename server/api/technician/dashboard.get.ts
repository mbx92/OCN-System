export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user || user.role !== 'TECHNICIAN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses hanya untuk teknisi',
    })
  }

  // Get technician profile for current user
  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
  })

  if (!technician) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akun Anda belum terhubung dengan profil teknisi',
    })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  // Get projects assigned to this technician
  const assignments = await prisma.projectTechnician.findMany({
    where: { technicianId: technician.id },
    include: {
      project: {
        include: {
          customer: true,
        },
      },
    },
  })

  const myProjects = assignments.map(a => a.project)

  // Calculate stats
  const activeProjects = myProjects.filter(p =>
    ['APPROVED', 'PROCUREMENT', 'ONGOING'].includes(p.status)
  ).length

  const completedThisMonth = myProjects.filter(p => {
    if (!['COMPLETED', 'PAID', 'CLOSED'].includes(p.status)) return false
    const endDate = p.endDate ? new Date(p.endDate) : null
    if (!endDate) return false
    return endDate >= startOfMonth && endDate <= endOfMonth
  }).length

  const pendingTasks = myProjects.filter(p => p.status === 'ONGOING').length

  // Get earnings this month
  const payments = await prisma.technicianPayment.findMany({
    where: {
      technicianId: technician.id,
      status: 'PAID',
      paidDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })

  const earnings = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Get recent activities - recent project updates for this technician's projects
  const projectIds = myProjects.map(p => p.id)
  const recentActivities = await prisma.activity.findMany({
    where: {
      entity: 'Project',
      entityId: { in: projectIds },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: { name: true },
      },
    },
  })

  return {
    stats: {
      activeProjects,
      completedThisMonth,
      pendingTasks,
      earnings,
    },
    projects: myProjects
      .filter(p => !['CANCELLED', 'CLOSED'].includes(p.status))
      .sort((a, b) => {
        // Sort by status priority then by date
        const statusOrder = ['ONGOING', 'APPROVED', 'PROCUREMENT', 'COMPLETED', 'PAID']
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }),
    activities: recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      createdAt: a.createdAt,
      userName: a.user?.name,
    })),
    technician: {
      id: technician.id,
      name: technician.name,
      type: technician.type,
      canViewEarnings: technician.canViewEarnings,
    },
  }
})
