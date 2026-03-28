import dayjs from 'dayjs'

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  const now = dayjs()
  const monthsData = []

  // Prepare last 6 months data structure
  for (let i = 5; i >= 0; i--) {
    const month = now.subtract(i, 'month')
    monthsData.push({
      label: month.format('MMM YYYY'),
      startDate: month.startOf('month').toDate(),
      endDate: month.endOf('month').toDate(),
      income: 0,
      expense: 0,
    })
  }

  // Fetch all paid payments in the last 6 months
  const oldestDate = monthsData[0].startDate
  const newestDate = monthsData[monthsData.length - 1].endDate

  const payments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      OR: [
        {
          paidDate: { gte: oldestDate, lte: newestDate },
        },
        {
          paidDate: null,
          paymentDate: { gte: oldestDate, lte: newestDate },
        },
      ],
    },
    select: { amount: true, paidDate: true, paymentDate: true },
  })

  // Distribute payments to months
  payments.forEach(payment => {
    const dateToUse = dayjs(payment.paidDate || payment.paymentDate)
    const monthObj = monthsData.find(
      m =>
        dateToUse.year() === dayjs(m.startDate).year() &&
        dateToUse.month() === dayjs(m.startDate).month()
    )
    if (monthObj) {
      monthObj.income += Number(payment.amount || 0)
    }
  })

  // Fetch all expense sources in the last 6 months in parallel
  const [expenses, projectExpenses, technicianPayments] = await Promise.all([
    // 1. General operational expenses
    prisma.expense.findMany({
      where: { date: { gte: oldestDate, lte: newestDate } },
      select: { amount: true, date: true },
    }),
    // 2. Project-specific expenses
    prisma.projectExpense.findMany({
      where: { date: { gte: oldestDate, lte: newestDate } },
      select: { amount: true, date: true },
    }),
    // 3. Technician salary/payments (only PAID ones)
    prisma.technicianPayment.findMany({
      where: {
        status: 'PAID',
        paidDate: { gte: oldestDate, lte: newestDate },
      },
      select: { amount: true, paidDate: true },
    }),
  ])

  // Helper to assign an expense-like record to the correct month bucket
  const assignExpense = (date: Date, amount: any) => {
    const d = dayjs(date)
    const monthObj = monthsData.find(
      m => d.year() === dayjs(m.startDate).year() && d.month() === dayjs(m.startDate).month()
    )
    if (monthObj) {
      monthObj.expense += Number(amount || 0)
    }
  }

  expenses.forEach(e => assignExpense(e.date, e.amount))
  projectExpenses.forEach(e => assignExpense(e.date, e.amount))
  technicianPayments.forEach(e => assignExpense(e.paidDate!, e.amount))

  // Aggregate Project Statuses
  const activeProjects = await prisma.project.groupBy({
    by: ['status'],
    _count: { id: true },
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
  })

  const projectStatusData = activeProjects.map(p => ({
    status: p.status,
    count: p._count.id,
  }))

  const incomeExpensesChart = {
    labels: monthsData.map(m => m.label),
    datasets: [
      {
        label: 'Income (Rp)',
        data: monthsData.map(m => m.income),
      },
      {
        label: 'Expense (Rp)',
        data: monthsData.map(m => m.expense),
      },
    ],
  }

  return {
    incomeExpensesChart,
    projectStatusData,
  }
})
