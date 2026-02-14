export default defineEventHandler(async event => {
  const query = getQuery(event)
  const year = query.year ? parseInt(query.year as string) : new Date().getFullYear()

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

  // === CASHFLOW (BASIS KAS) ===
  const cashTransactions = await prisma.cashTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  })

  const cashIncome = cashTransactions.filter(t => t.type === 'INCOME')
  const cashExpense = cashTransactions.filter(t => t.type === 'EXPENSE')

  const cashIncomeByCategory = cashIncome.reduce(
    (acc, t) => {
      const cat = t.category
      if (!acc[cat]) acc[cat] = { amount: 0, count: 0 }
      acc[cat].amount += Number(t.amount)
      acc[cat].count += 1
      return acc
    },
    {} as Record<string, { amount: number; count: number }>
  )

  const cashExpenseByCategory = cashExpense.reduce(
    (acc, t) => {
      const cat = t.category
      if (!acc[cat]) acc[cat] = { amount: 0, count: 0 }
      acc[cat].amount += Number(t.amount)
      acc[cat].count += 1
      return acc
    },
    {} as Record<string, { amount: number; count: number }>
  )

  const totalCashIncome = cashIncome.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalCashExpense = cashExpense.reduce((sum, t) => sum + Number(t.amount), 0)
  const cashBalance = totalCashIncome - totalCashExpense

  // === LABA RUGI (BASIS AKRUAL) ===

  // Pendapatan dari payments
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: startDate, lte: endDate },
    },
  })
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  // HPP dari project items & expenses
  const projects = await prisma.project.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              isService: true,
            },
          },
        },
      },
      expenses: true,
    },
  })

  let totalItemsCost = 0
  let totalServiceCost = 0 // Items tanpa PO (habis pakai, maintenance)
  let totalProjectExpenses = 0

  for (const proj of projects) {
    for (const item of proj.items) {
      const itemCost = Number(item.totalCost)
      // Pisahkan items dengan PO vs tanpa PO (service/habis pakai)
      if (item.poStatus === 'NONE' || item.poStatus === 'PENDING') {
        // Hanya hitung sebagai service cost jika product adalah service
        if (item.product?.isService) {
          totalServiceCost += itemCost
        } else {
          // Non-service items tanpa PO masuk ke material cost
          totalItemsCost += itemCost
        }
      } else {
        totalItemsCost += itemCost
      }
    }
    for (const exp of proj.expenses) {
      totalProjectExpenses += Number(exp.amount)
    }
  }

  const totalCOGS = totalItemsCost + totalServiceCost + totalProjectExpenses

  // Biaya operasional dari cash transactions
  const salaryTransactions = cashExpense.filter(t => t.category === 'SALARY')
  const totalOperationalExpense = salaryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

  const grossProfit = totalRevenue - totalCOGS
  const netProfit = grossProfit - totalOperationalExpense

  // === ANALISIS PERBEDAAN ===
  const difference = cashBalance - netProfit

  // Breakdown perbedaan
  const incomeDiff = totalCashIncome - totalRevenue
  const expenseDiff = totalCashExpense - (totalCOGS + totalOperationalExpense)

  // Items dengan cost tapi tidak ada PO (service items) - untuk detail
  const serviceItems = await prisma.projectItem.findMany({
    where: {
      project: {
        createdAt: { gte: startDate, lte: endDate },
      },
      totalCost: { gt: 0 },
      poStatus: { in: ['NONE', 'PENDING'] },
    },
    include: {
      project: {
        select: {
          projectNumber: true,
        },
      },
    },
  })

  const serviceItemsCount = serviceItems.length

  return {
    year,
    period: {
      start: startDate,
      end: endDate,
    },
    cashflow: {
      income: {
        total: totalCashIncome,
        byCategory: cashIncomeByCategory,
        count: cashIncome.length,
      },
      expense: {
        total: totalCashExpense,
        byCategory: cashExpenseByCategory,
        count: cashExpense.length,
      },
      balance: cashBalance,
    },
    accrual: {
      revenue: totalRevenue,
      cogs: {
        total: totalCOGS,
        items: totalItemsCost,
        service: totalServiceCost, // HPP Service/Habis Pakai
        expenses: totalProjectExpenses,
      },
      operationalExpense: totalOperationalExpense,
      grossProfit,
      netProfit,
    },
    analysis: {
      difference,
      incomeDiff,
      expenseDiff,
      serviceCost: totalServiceCost,
      serviceItemsCount: serviceItemsCount,
    },
    metadata: {
      projectsCount: projects.length,
      paymentsCount: payments.length,
      cashTransactionsCount: cashTransactions.length,
    },
  }
})
