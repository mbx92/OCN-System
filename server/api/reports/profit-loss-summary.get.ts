import { H3Event } from 'h3'

interface PeriodSummary {
  period: string
  periodValue: number
  periodLabel: string
  revenue: number
  expenses: number
  profit: number
  projectCount: number
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month' // month, quarter, year

  try {
    const summaries: PeriodSummary[] = []
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]
    const monthNamesShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]

    if (period === 'month') {
      // Generate 12 months
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        const [projectData, expenseData, paymentData, cashExpenseData, projectItemsCost] =
          await Promise.all([
            // Get projects
            prisma.project.findMany({
              where: {
                OR: [
                  { startDate: { gte: startDate, lte: endDate } },
                  { endDate: { gte: startDate, lte: endDate } },
                ],
                status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
              },
              select: { id: true, finalPrice: true, budget: true },
            }),
            // Get expenses from Expense model
            prisma.expense.aggregate({
              where: { date: { gte: startDate, lte: endDate } },
              _sum: { amount: true },
            }),
            // Get payments
            prisma.payment.aggregate({
              where: { paymentDate: { gte: startDate, lte: endDate } },
              _sum: { amount: true },
            }),
            // Get expenses from CashTransaction (excludes PO to avoid double-counting with project items)
            prisma.cashTransaction.aggregate({
              where: {
                date: { gte: startDate, lte: endDate },
                type: 'EXPENSE',
                category: { notIn: ['PO', 'PAYMENT'] },
              },
              _sum: { amount: true },
            }),
            // Get project items cost (material/HPP)
            prisma.projectItem.aggregate({
              where: {
                project: {
                  OR: [
                    { startDate: { gte: startDate, lte: endDate } },
                    { endDate: { gte: startDate, lte: endDate } },
                  ],
                  status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
                },
              },
              _sum: { totalCost: true },
            }),
          ])

        const revenue =
          Number(paymentData._sum.amount) ||
          projectData.reduce((sum, p) => sum + Number(p.finalPrice || p.budget || 0), 0)
        const expenses =
          Number(projectItemsCost._sum.totalCost || 0) +
          Number(expenseData._sum.amount || 0) +
          Number(cashExpenseData._sum.amount || 0)

        summaries.push({
          period: 'month',
          periodValue: month,
          periodLabel: monthNamesShort[month - 1],
          revenue,
          expenses,
          profit: revenue - expenses,
          projectCount: projectData.length,
        })
      }
    } else if (period === 'quarter') {
      // Generate 4 quarters
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterStartMonth = (quarter - 1) * 3
        const startDate = new Date(year, quarterStartMonth, 1)
        const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)

        const [projectData, expenseData, paymentData, cashExpenseData, projectItemsCost] =
          await Promise.all([
            prisma.project.findMany({
              where: {
                OR: [
                  { startDate: { gte: startDate, lte: endDate } },
                  { endDate: { gte: startDate, lte: endDate } },
                ],
                status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
              },
              select: { id: true, finalPrice: true, budget: true },
            }),
            prisma.expense.aggregate({
              where: { date: { gte: startDate, lte: endDate } },
              _sum: { amount: true },
            }),
            prisma.payment.aggregate({
              where: { paymentDate: { gte: startDate, lte: endDate } },
              _sum: { amount: true },
            }),
            prisma.cashTransaction.aggregate({
              where: {
                date: { gte: startDate, lte: endDate },
                type: 'EXPENSE',
                category: { notIn: ['PO', 'PAYMENT'] },
              },
              _sum: { amount: true },
            }),
            prisma.projectItem.aggregate({
              where: {
                project: {
                  OR: [
                    { startDate: { gte: startDate, lte: endDate } },
                    { endDate: { gte: startDate, lte: endDate } },
                  ],
                  status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
                },
              },
              _sum: { totalCost: true },
            }),
          ])

        const revenue =
          Number(paymentData._sum.amount) ||
          projectData.reduce((sum, p) => sum + Number(p.finalPrice || p.budget || 0), 0)
        const expenses =
          Number(projectItemsCost._sum.totalCost || 0) +
          Number(expenseData._sum.amount || 0) +
          Number(cashExpenseData._sum.amount || 0)

        summaries.push({
          period: 'quarter',
          periodValue: quarter,
          periodLabel: `Q${quarter}`,
          revenue,
          expenses,
          profit: revenue - expenses,
          projectCount: projectData.length,
        })
      }
    } else {
      // Full year
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

      const [projectData, expenseData, paymentData, cashExpenseData, projectItemsCost] =
        await Promise.all([
          prisma.project.findMany({
            where: {
              OR: [
                { startDate: { gte: startDate, lte: endDate } },
                { endDate: { gte: startDate, lte: endDate } },
              ],
              status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
            },
            select: { id: true, finalPrice: true, budget: true },
          }),
          prisma.expense.aggregate({
            where: { date: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          }),
          prisma.payment.aggregate({
            where: { paymentDate: { gte: startDate, lte: endDate } },
            _sum: { amount: true },
          }),
          prisma.cashTransaction.aggregate({
            where: {
              date: { gte: startDate, lte: endDate },
              type: 'EXPENSE',
              category: { notIn: ['PO', 'PAYMENT'] },
            },
            _sum: { amount: true },
          }),
          prisma.projectItem.aggregate({
            where: {
              project: {
                OR: [
                  { startDate: { gte: startDate, lte: endDate } },
                  { endDate: { gte: startDate, lte: endDate } },
                ],
                status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
              },
            },
            _sum: { totalCost: true },
          }),
        ])

      const revenue =
        Number(paymentData._sum.amount) ||
        projectData.reduce((sum, p) => sum + Number(p.finalPrice || p.budget || 0), 0)
      const expenses =
        Number(projectItemsCost._sum.totalCost || 0) +
        Number(expenseData._sum.amount || 0) +
        Number(cashExpenseData._sum.amount || 0)

      summaries.push({
        period: 'year',
        periodValue: year,
        periodLabel: `Tahun ${year}`,
        revenue,
        expenses,
        profit: revenue - expenses,
        projectCount: projectData.length,
      })
    }

    // Calculate totals
    const totals = {
      revenue: summaries.reduce((sum, s) => sum + s.revenue, 0),
      expenses: summaries.reduce((sum, s) => sum + s.expenses, 0),
      profit: summaries.reduce((sum, s) => sum + s.profit, 0),
      projectCount: summaries.reduce((sum, s) => sum + s.projectCount, 0),
    }

    return {
      year,
      period,
      summaries,
      totals,
    }
  } catch (error: any) {
    console.error('Error generating P&L summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate profit and loss summary',
    })
  }
})
