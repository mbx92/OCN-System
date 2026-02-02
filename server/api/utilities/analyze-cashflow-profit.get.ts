// GET /api/utilities/analyze-cashflow-profit
// Analyze difference between cashflow and profit-loss

export default defineEventHandler(async event => {
  try {
    const query = getQuery(event)
    const year = parseInt((query.year as string) || new Date().getFullYear().toString())

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    // CASHFLOW
    const [cashIncome, cashExpense] = await Promise.all([
      prisma.cashTransaction.findMany({
        where: { date: { gte: startDate, lte: endDate }, type: 'INCOME' },
      }),
      prisma.cashTransaction.findMany({
        where: { date: { gte: startDate, lte: endDate }, type: 'EXPENSE' },
      }),
    ])

    const totalCashIncome = cashIncome.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const totalCashExpense = cashExpense.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const cashFlowBalance = totalCashIncome - totalCashExpense

    // Income by category
    const incomeByCategory: { [key: string]: { count: number; amount: number } } = {}
    cashIncome.forEach(tx => {
      if (!incomeByCategory[tx.category]) {
        incomeByCategory[tx.category] = { count: 0, amount: 0 }
      }
      incomeByCategory[tx.category].count++
      incomeByCategory[tx.category].amount += Number(tx.amount)
    })

    // Expense by category
    const expenseByCategory: { [key: string]: { count: number; amount: number } } = {}
    cashExpense.forEach(tx => {
      if (!expenseByCategory[tx.category]) {
        expenseByCategory[tx.category] = { count: 0, amount: 0 }
      }
      expenseByCategory[tx.category].count++
      expenseByCategory[tx.category].amount += Number(tx.amount)
    })

    // LABA RUGI
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        type: { in: ['FULL', 'DP', 'INSTALLMENT', 'SETTLEMENT'] },
      },
      include: {
        project: { select: { status: true } },
      },
    })

    const validPayments = payments.filter(p => !p.project || p.project.status !== 'CANCELLED')
    const totalPendapatan = validPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    // HPP
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
        ],
        status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
      },
      include: {
        items: true,
        expenses: true,
      },
    })

    let totalItemsCost = 0
    let totalProjectExpenses = 0

    projects.forEach(p => {
      const itemsCost = p.items.reduce((sum, i) => sum + Number(i.totalCost || 0), 0)
      const projectExpenses = p.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      totalItemsCost += itemsCost
      totalProjectExpenses += projectExpenses
    })

    const totalHPP = totalItemsCost + totalProjectExpenses
    const labaKotor = totalPendapatan - totalHPP

    // Biaya operasional
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        project: { select: { status: true } },
      },
    })

    const validExpenses = expenses.filter(e => !e.project || e.project.status !== 'CANCELLED')
    const operasionalExpenses = validExpenses.filter(e => e.type !== 'PROJECT')
    const totalExpenses = operasionalExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    const otherCashExpenses = cashExpense.filter(ct => !['PO', 'PAYMENT'].includes(ct.category))
    const totalCashOps = otherCashExpenses.reduce((sum, ct) => sum + Number(ct.amount), 0)

    const totalBiayaOperasional = totalExpenses + totalCashOps
    const labaBersih = labaKotor - totalBiayaOperasional

    // Analysis
    const selisih = cashFlowBalance - labaBersih
    const diffIncome = totalCashIncome - totalPendapatan
    const totalLabaRugiExpense = totalHPP + totalBiayaOperasional
    const diffExpense = totalCashExpense - totalLabaRugiExpense

    return {
      year,
      cashflow: {
        totalIncome: totalCashIncome,
        totalExpense: totalCashExpense,
        balance: cashFlowBalance,
        incomeByCategory,
        expenseByCategory,
      },
      profitLoss: {
        pendapatan: totalPendapatan,
        hpp: totalHPP,
        hppItems: totalItemsCost,
        hppProjectExpenses: totalProjectExpenses,
        labaKotor,
        biayaOperasional: totalBiayaOperasional,
        labaBersih,
      },
      analysis: {
        selisih,
        diffIncome,
        diffExpense,
        percentageDiff: labaBersih !== 0 ? ((selisih / labaBersih) * 100).toFixed(2) : 0,
      },
    }
  } catch (error: any) {
    console.error('Error analyzing cashflow vs profit:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze cashflow vs profit',
    })
  }
})
