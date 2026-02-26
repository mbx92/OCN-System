import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const startDate = new Date(2025, 0, 1)
  const endDate = new Date(2025, 11, 31, 23, 59, 59)

  console.log('=== 1. CEK PEMASUKAN KATEGORI OTHER ===\n')

  const otherIncome = await prisma.cashTransaction.findMany({
    where: {
      type: 'INCOME',
      category: 'OTHER',
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  })

  console.table(
    otherIncome.map(t => ({
      Date: t.date.toISOString().split('T')[0],
      Amount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(Number(t.amount)),
      Description: t.description,
      Reference: t.referenceType + '#' + t.referenceId,
    }))
  )

  const totalOther = otherIncome.reduce((sum, t) => sum + Number(t.amount), 0)
  console.log(
    '\nTotal OTHER Income:',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalOther)
  )

  console.log('\n=== 2. CEK SELISIH HPP vs PO ===\n')

  // Total PO cashflow
  const poCash = await prisma.cashTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'PO',
      date: { gte: startDate, lte: endDate },
    },
  })
  const totalPoCash = poCash.reduce((sum, t) => sum + Number(t.amount), 0)

  // Total HPP dari project items
  const projects = await prisma.project.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      items: true,
    },
  })

  let totalItemsCost = 0
  for (const proj of projects) {
    for (const item of proj.items) {
      totalItemsCost += Number(item.totalCost)
    }
  }

  console.log(
    'Total PO (Cash Out):',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPoCash)
  )
  console.log(
    'Total Items Cost (HPP):',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalItemsCost)
  )
  console.log(
    'Selisih:',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
      totalItemsCost - totalPoCash
    )
  )

  console.log('\n=== 3. CEK PROJECT EXPENSES vs CASHFLOW ===\n')

  // Total project expense cashflow
  const expenseCash = await prisma.cashTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'PROJECT_EXPENSE',
      date: { gte: startDate, lte: endDate },
    },
  })
  const totalExpenseCash = expenseCash.reduce((sum, t) => sum + Number(t.amount), 0)

  // Total project expense dari table
  let totalProjectExpenses = 0
  for (const proj of projects) {
    const expenses = await prisma.projectExpense.findMany({
      where: { projectId: proj.id },
    })
    totalProjectExpenses += expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  }

  console.log(
    'Total Project Expense (Recorded):',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
      totalProjectExpenses
    )
  )
  console.log(
    'Total Project Expense (Cash Out):',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpenseCash)
  )
  console.log(
    'Selisih:',
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
      totalProjectExpenses - totalExpenseCash
    )
  )

  await prisma.$disconnect()
}

main()
