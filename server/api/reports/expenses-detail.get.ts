import { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month'
  const periodValue = query.periodValue ? parseInt(query.periodValue as string) : null

  try {
    // Calculate date range
    let startDate: Date
    let endDate: Date

    if (period === 'month' && periodValue) {
      startDate = new Date(year, periodValue - 1, 1)
      endDate = new Date(year, periodValue, 0, 23, 59, 59, 999)
    } else if (period === 'quarter' && periodValue) {
      const quarterStartMonth = (periodValue - 1) * 3
      startDate = new Date(year, quarterStartMonth, 1)
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    // Get detailed data
    const [technicianPayments, projectExpenses, expenses, cashTransactions] = await Promise.all([
      prisma.technicianPayment.findMany({
        where: {
          paidDate: { gte: startDate, lte: endDate },
          status: 'PAID',
        },
        include: {
          technician: true,
          project: { select: { projectNumber: true, title: true } },
        },
        orderBy: { paidDate: 'desc' },
      }),
      prisma.projectExpense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: {
          project: { select: { projectNumber: true, title: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: {
          project: { select: { projectNumber: true, title: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.cashTransaction.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          type: 'EXPENSE',
          category: { notIn: ['PO', 'PAYMENT'] },
        },
        orderBy: { date: 'desc' },
      }),
    ])

    // Format all items
    const items = [
      // Technician Payments
      ...technicianPayments.map(tp => ({
        id: tp.id,
        type: 'TECHNICIAN' as const,
        category: 'Pembayaran Teknisi',
        description: `${tp.technician.name} - ${tp.description || tp.period}`,
        amount: Number(tp.amount),
        date: tp.paidDate?.toISOString() || tp.createdAt.toISOString(),
        reference: tp.paymentNumber,
        projectNumber: tp.project?.projectNumber,
        projectTitle: tp.project?.title,
      })),
      // Project Expenses
      ...projectExpenses.map(pe => ({
        id: pe.id,
        type: 'PROJECT' as const,
        category: pe.category,
        description: pe.description,
        amount: Number(pe.amount),
        date: pe.date.toISOString(),
        reference: null,
        projectNumber: pe.project?.projectNumber,
        projectTitle: pe.project?.title,
      })),
      // General Expenses
      ...expenses.map(e => ({
        id: e.id,
        type: e.type as string,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        reference: null,
        projectNumber: e.project?.projectNumber,
        projectTitle: e.project?.title,
      })),
      // Cash Transactions
      ...cashTransactions.map(ct => ({
        id: ct.id,
        type: 'CASH' as const,
        category: ct.category,
        description: ct.description,
        amount: Number(ct.amount),
        date: ct.date.toISOString(),
        reference: ct.reference,
        projectNumber: null,
        projectTitle: null,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate totals by type
    const totals = {
      technicianTotal: items
        .filter(i => i.type === 'TECHNICIAN')
        .reduce((sum, i) => sum + i.amount, 0),
      projectExpenseTotal: items
        .filter(i => i.type === 'PROJECT')
        .reduce((sum, i) => sum + i.amount, 0),
      operationalTotal: items
        .filter(i => i.type === 'OPERATIONAL')
        .reduce((sum, i) => sum + i.amount, 0),
      cashExpenseTotal: items.filter(i => i.type === 'CASH').reduce((sum, i) => sum + i.amount, 0),
      total: items.reduce((sum, i) => sum + i.amount, 0),
    }

    return {
      items,
      totals,
      period,
      periodValue,
      year,
    }
  } catch (error: any) {
    console.error('Error generating expenses detail:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate expenses detail',
    })
  }
})
