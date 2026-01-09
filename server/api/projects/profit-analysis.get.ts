export default defineEventHandler(async () => {
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ['APPROVED', 'PROCUREMENT', 'ONGOING', 'COMPLETED', 'PAID', 'CLOSED'],
      },
    },
    include: {
      customer: true,
      items: true,
      expenses: true,
      technicians: {
        include: {
          technician: {
            include: {
              payments: {
                where: {
                  projectId: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get cash transactions for these projects (to check if remaining wage is saved)
  const projectIds = projects.map(p => p.id)
  const cashTransactions = await prisma.cashTransaction.findMany({
    where: {
      referenceType: 'Project',
      referenceId: { in: projectIds },
      type: 'INCOME',
      description: { contains: 'Sisa upah teknisi' },
    },
  })

  // Map cash transactions to projects
  const cashTransactionsByProject = new Map<string, (typeof cashTransactions)[0]>()
  cashTransactions.forEach(ct => {
    if (ct.referenceId) {
      cashTransactionsByProject.set(ct.referenceId, ct)
    }
  })

  // Add remainingWageSaved flag to each project
  const projectsWithCashInfo = projects.map(p => ({
    ...p,
    remainingWageSaved: cashTransactionsByProject.has(p.id),
    remainingWageTransaction: cashTransactionsByProject.get(p.id) || null,
  }))

  return projectsWithCashInfo
})
