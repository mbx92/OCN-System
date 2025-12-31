export default defineEventHandler(async () => {
  const technicians = await prisma.technician.findMany({
    orderBy: { name: 'asc' },
    include: {
      assignments: {
        include: {
          project: {
            select: {
              status: true,
            },
          },
        },
      },
      payments: {
        where: {
          status: 'PAID',
        },
        select: {
          amount: true,
        },
      },
    },
  })

  // Calculate statistics for each technician
  const techniciansWithStats = technicians.map(tech => {
    // Total projects
    const totalProjects = tech.assignments.length

    // Active projects (ONGOING status)
    const activeProjects = tech.assignments.filter(a => a.project.status === 'ONGOING').length

    // Total earnings from paid project assignments
    const earningsFromAssignments = tech.assignments
      .filter(a => a.isPaid)
      .reduce((sum, a) => sum + Number(a.fee), 0)

    // Total earnings from technician payments (PAID status)
    const earningsFromPayments = tech.payments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Total earnings
    const totalEarnings = earningsFromAssignments + earningsFromPayments

    // Remove assignments and payments from response, return only stats
    const { assignments, payments, ...techData } = tech

    return {
      ...techData,
      totalProjects,
      activeProjects,
      totalEarnings,
    }
  })

  return techniciansWithStats
})
