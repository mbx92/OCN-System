import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAugustProfitLoss() {
  try {
    const year = 2025
    const month = 8 // Agustus

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    console.log('=== CEK LABA RUGI AGUSTUS 2025 ===')
    console.log(
      `Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}\n`
    )

    // 1. CEK PENDAPATAN (Payments)
    console.log('--- PENDAPATAN (Payments) ---')
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        type: { in: ['FULL', 'DP', 'INSTALLMENT', 'SETTLEMENT'] },
      },
      include: {
        project: { select: { projectNumber: true, title: true, status: true } },
      },
    })

    const validPayments = payments.filter(p => !p.project || p.project.status !== 'CANCELLED')
    const totalPendapatan = validPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    console.log(`Total Payments: ${validPayments.length}`)
    validPayments.forEach(p => {
      console.log(
        `  - ${p.paymentNumber}: Rp ${Number(p.amount).toLocaleString('id-ID')} (${p.project?.projectNumber})`
      )
    })
    console.log(`TOTAL PENDAPATAN: Rp ${totalPendapatan.toLocaleString('id-ID')}\n`)

    // 2. CEK PROJECTS
    console.log('--- PROJECTS (dalam periode) ---')
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

    console.log(`Total Projects: ${projects.length}`)
    let totalHPP = 0
    projects.forEach(p => {
      const itemsCost = p.items.reduce((sum, i) => sum + Number(i.totalCost || 0), 0)
      const projectExpenses = p.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const projectHPP = itemsCost + projectExpenses
      totalHPP += projectHPP

      console.log(`  - ${p.projectNumber}: ${p.title}`)
      console.log(`    Items Cost: Rp ${itemsCost.toLocaleString('id-ID')}`)
      console.log(`    Project Expenses: Rp ${projectExpenses.toLocaleString('id-ID')}`)
      console.log(`    Total HPP: Rp ${projectHPP.toLocaleString('id-ID')}`)
    })
    console.log(`TOTAL HPP: Rp ${totalHPP.toLocaleString('id-ID')}\n`)

    // 3. CEK EXPENSES (Non-Project)
    console.log('--- EXPENSES (Biaya Operasional) ---')
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
    const totalOperasional = operasionalExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

    console.log(`Total Expenses: ${operasionalExpenses.length}`)
    const expensesByCategory: { [key: string]: number } = {}
    operasionalExpenses.forEach(e => {
      const key = `${e.type} - ${e.category}`
      expensesByCategory[key] = (expensesByCategory[key] || 0) + Number(e.amount)
    })

    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      console.log(`  - ${category}: Rp ${amount.toLocaleString('id-ID')}`)
    })
    console.log(`TOTAL BIAYA OPERASIONAL: Rp ${totalOperasional.toLocaleString('id-ID')}\n`)

    // 4. CEK CASH TRANSACTIONS
    console.log('--- CASH TRANSACTIONS (Expense) ---')
    const cashTx = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
      },
    })

    const otherCashExpenses = cashTx.filter(ct => !['PO', 'PAYMENT'].includes(ct.category))
    const totalCashExpense = otherCashExpenses.reduce((sum, ct) => sum + Number(ct.amount), 0)

    console.log(`Total Cash Transactions: ${otherCashExpenses.length}`)
    const cashByCategory: { [key: string]: number } = {}
    otherCashExpenses.forEach(ct => {
      const key = ct.category
      cashByCategory[key] = (cashByCategory[key] || 0) + Number(ct.amount)
    })

    Object.entries(cashByCategory).forEach(([category, amount]) => {
      console.log(`  - ${category}: Rp ${amount.toLocaleString('id-ID')}`)
    })
    console.log(`TOTAL CASH EXPENSE: Rp ${totalCashExpense.toLocaleString('id-ID')}\n`)

    // SUMMARY
    console.log('=== SUMMARY ===')
    const penjualanBersih = totalPendapatan
    const labaKotor = penjualanBersih - totalHPP
    const totalBiayaOps = totalOperasional + totalCashExpense
    const labaBersih = labaKotor - totalBiayaOps

    console.log(`Pendapatan Kotor: Rp ${totalPendapatan.toLocaleString('id-ID')}`)
    console.log(`HPP: Rp ${totalHPP.toLocaleString('id-ID')}`)
    console.log(`Laba Kotor: Rp ${labaKotor.toLocaleString('id-ID')}`)
    console.log(`Biaya Operasional (Expenses): Rp ${totalOperasional.toLocaleString('id-ID')}`)
    console.log(`Biaya Operasional (Cash): Rp ${totalCashExpense.toLocaleString('id-ID')}`)
    console.log(`Total Biaya Operasional: Rp ${totalBiayaOps.toLocaleString('id-ID')}`)
    console.log(`---`)
    console.log(`LABA BERSIH: Rp ${labaBersih.toLocaleString('id-ID')}`)

    if (labaBersih < 0) {
      console.log('\n⚠️ RUGI!')
      console.log('Kemungkinan penyebab:')
      if (totalPendapatan === 0) {
        console.log('  - Tidak ada pendapatan di bulan ini')
      }
      if (totalHPP > totalPendapatan) {
        console.log(`  - HPP (Rp ${totalHPP.toLocaleString('id-ID')}) lebih besar dari pendapatan`)
      }
      if (totalBiayaOps > labaKotor) {
        console.log(
          `  - Biaya operasional (Rp ${totalBiayaOps.toLocaleString('id-ID')}) lebih besar dari laba kotor`
        )
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAugustProfitLoss()
