import { H3Event } from 'h3'

interface ExpenseSummary {
  period: string
  periodValue: number
  periodLabel: string
  technicianTotal: number
  projectExpenseTotal: number
  operationalTotal: number
  cashExpenseTotal: number
  total: number
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month'

  try {
    const summaries: ExpenseSummary[] = []
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

    const generatePeriodData = async (startDate: Date, endDate: Date) => {
      const [technicianPayments, projectExpenses, expenses, cashTransactions] = await Promise.all([
        // Technician Payments (PAID status)
        prisma.technicianPayment.findMany({
          where: {
            paidDate: { gte: startDate, lte: endDate },
            status: 'PAID',
          },
        }),
        // Project Expenses (from ProjectExpense model)
        prisma.projectExpense.aggregate({
          where: { date: { gte: startDate, lte: endDate } },
          _sum: { amount: true },
        }),
        // General Expenses (from Expense model)
        prisma.expense.findMany({
          where: { date: { gte: startDate, lte: endDate } },
        }),
        // Cash Transactions (EXPENSE type, excluding PO to avoid double counting)
        prisma.cashTransaction.findMany({
          where: {
            date: { gte: startDate, lte: endDate },
            type: 'EXPENSE',
            category: { notIn: ['PO', 'PAYMENT'] },
          },
        }),
      ])

      const technicianTotal = technicianPayments.reduce((sum, tp) => sum + Number(tp.amount), 0)
      const projectExpenseTotal = Number(projectExpenses._sum.amount || 0)
      const operationalTotal = expenses
        .filter(e => e.type === 'OPERATIONAL')
        .reduce((sum, e) => sum + Number(e.amount), 0)
      const cashExpenseTotal = cashTransactions.reduce((sum, ct) => sum + Number(ct.amount), 0)

      return {
        technicianTotal,
        projectExpenseTotal,
        operationalTotal,
        cashExpenseTotal,
        total: technicianTotal + projectExpenseTotal + operationalTotal + cashExpenseTotal,
      }
    }

    if (period === 'month') {
      for (let month = 1; month <= 12; month++) {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)
        const data = await generatePeriodData(startDate, endDate)

        summaries.push({
          period: 'month',
          periodValue: month,
          periodLabel: monthNamesShort[month - 1],
          ...data,
        })
      }
    } else if (period === 'quarter') {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const quarterStartMonth = (quarter - 1) * 3
        const startDate = new Date(year, quarterStartMonth, 1)
        const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
        const data = await generatePeriodData(startDate, endDate)

        summaries.push({
          period: 'quarter',
          periodValue: quarter,
          periodLabel: `Q${quarter}`,
          ...data,
        })
      }
    } else {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      const data = await generatePeriodData(startDate, endDate)

      summaries.push({
        period: 'year',
        periodValue: year,
        periodLabel: `Tahun ${year}`,
        ...data,
      })
    }

    // Calculate totals
    const totals = {
      technicianTotal: summaries.reduce((sum, s) => sum + s.technicianTotal, 0),
      projectExpenseTotal: summaries.reduce((sum, s) => sum + s.projectExpenseTotal, 0),
      operationalTotal: summaries.reduce((sum, s) => sum + s.operationalTotal, 0),
      cashExpenseTotal: summaries.reduce((sum, s) => sum + s.cashExpenseTotal, 0),
      total: summaries.reduce((sum, s) => sum + s.total, 0),
    }

    return {
      year,
      period,
      summaries,
      totals,
    }
  } catch (error: any) {
    console.error('Error generating expenses report:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate expenses report',
    })
  }
})
