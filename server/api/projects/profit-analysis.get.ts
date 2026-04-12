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

  const calculateItemRevenue = (project: (typeof projects)[number]) => {
    return project.items.reduce((sum, item) => {
      const actualQty = Math.max(0, Number(item.quantity || 0) - Number(item.returnedQty || 0))
      const price = Number(item.price || 0)
      const totalPrice = Number(item.totalPrice || 0)

      if (actualQty > 0 && price > 0) {
        return sum + actualQty * price
      }

      return sum + totalPrice
    }, 0)
  }

  const calculateItemCost = (project: (typeof projects)[number]) => {
    return project.items.reduce((sum, item) => {
      const actualQty = Math.max(0, Number(item.quantity || 0) - Number(item.returnedQty || 0))
      const cost = Number(item.cost || 0)
      const totalCost = Number(item.totalCost || 0)

      if (actualQty > 0 && cost > 0) {
        return sum + actualQty * cost
      }

      return sum + totalCost
    }, 0)
  }

  const calculateExpenseCost = (project: (typeof projects)[number]) => {
    return project.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  }

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
  const projectsWithCashInfo = projects.map(p => {
    const itemRevenue = calculateItemRevenue(p)
    const itemCost = calculateItemCost(p)
    const expenseCost = calculateExpenseCost(p)
    const sellingValue = itemRevenue > 0 ? itemRevenue : Number(p.finalPrice || 0)

    return {
      ...p,
      sellingValue,
      itemRevenue,
      itemCost,
      expenseCost,
      totalHpp: itemCost + expenseCost,
      remainingWageSaved: cashTransactionsByProject.has(p.id),
      remainingWageTransaction: cashTransactionsByProject.get(p.id) || null,
    }
  })

  return projectsWithCashInfo
})
