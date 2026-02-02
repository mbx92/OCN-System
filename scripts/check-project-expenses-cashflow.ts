import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProjectExpensesCashflow() {
  try {
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== CEK PROJECT EXPENSES vs CASHFLOW ===\n')

    // Get all project expenses
    const projectExpenses = await prisma.projectExpense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        project: { select: { projectNumber: true, status: true } },
      },
      orderBy: { date: 'asc' },
    })

    const validProjectExpenses = projectExpenses.filter(
      e => !e.project || e.project.status !== 'CANCELLED'
    )

    console.log(`Total Project Expenses 2025: ${validProjectExpenses.length}\n`)

    if (validProjectExpenses.length === 0) {
      console.log('Tidak ada project expenses di 2025')
      return
    }

    // Check each project expense if it has cashflow
    console.log('Detail Project Expenses:\n')

    let totalAmount = 0
    let withCashflow = 0
    let withoutCashflow = 0
    const missingCashflow: any[] = []

    for (const exp of validProjectExpenses) {
      totalAmount += Number(exp.amount)

      // Check if there's a cashflow for this expense
      const cashTx = await prisma.cashTransaction.findFirst({
        where: {
          OR: [
            { referenceId: exp.id, referenceType: 'ProjectExpense' },
            {
              date: exp.date,
              amount: exp.amount,
              description: { contains: exp.description },
            },
          ],
        },
      })

      console.log(`${exp.project.projectNumber} - ${exp.date.toLocaleDateString('id-ID')}`)
      console.log(`  ${exp.description}`)
      console.log(`  Amount: Rp ${Number(exp.amount).toLocaleString('id-ID')}`)

      if (cashTx) {
        console.log(`  ✅ ADA cashflow: ${cashTx.category} - ${cashTx.description}`)
        withCashflow++
      } else {
        console.log(`  ❌ TIDAK ADA cashflow`)
        withoutCashflow++
        missingCashflow.push(exp)
      }
      console.log()
    }

    console.log('═'.repeat(80))
    console.log(`TOTAL Project Expenses: Rp ${totalAmount.toLocaleString('id-ID')}`)
    console.log(
      `Dengan Cashflow:   ${withCashflow} (${((withCashflow / validProjectExpenses.length) * 100).toFixed(1)}%)`
    )
    console.log(
      `Tanpa Cashflow:    ${withoutCashflow} (${((withoutCashflow / validProjectExpenses.length) * 100).toFixed(1)}%)`
    )
    console.log('═'.repeat(80) + '\n')

    if (missingCashflow.length > 0) {
      console.log('⚠️ PROJECT EXPENSES YANG BELUM TERCATAT DI CASHFLOW:\n')

      const totalMissing = missingCashflow.reduce((sum, e) => sum + Number(e.amount), 0)

      missingCashflow.forEach((exp, idx) => {
        console.log(
          `${idx + 1}. ${exp.project.projectNumber} - ${exp.date.toLocaleDateString('id-ID')}`
        )
        console.log(`   ${exp.description}`)
        console.log(`   Rp ${Number(exp.amount).toLocaleString('id-ID')}`)
        console.log()
      })

      console.log(`Total yang belum tercatat: Rp ${totalMissing.toLocaleString('id-ID')}\n`)

      console.log('💡 PENJELASAN:\n')
      console.log('Project Expenses adalah biaya langsung project (seperti makan siang teknisi).')
      console.log('Seharusnya:')
      console.log('1. Dicatat di HPP (Laba Rugi) ✅ SUDAH')
      console.log('2. Dicatat di Cashflow sebagai EXPENSE ❌ BELUM\n')
      console.log('Dampak:')
      console.log('• Laba Rugi: Biaya sudah dikurangi (benar)')
      console.log('• Cashflow: Pengeluaran belum tercatat (salah)')
      console.log(`• Selisih: Cashflow lebih tinggi Rp ${totalMissing.toLocaleString('id-ID')}\n`)
    } else {
      console.log('✅ Semua Project Expenses sudah tercatat di Cashflow\n')
    }

    // Check: apakah ada EXPENSE category untuk project expenses?
    console.log('─'.repeat(80) + '\n')
    console.log('CEK CASH TRANSACTIONS EXPENSE (non-SALARY, non-PO):\n')

    const otherExpenses = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
        category: { notIn: ['SALARY', 'PO', 'PAYMENT'] },
      },
    })

    if (otherExpenses.length > 0) {
      console.log(`Ditemukan ${otherExpenses.length} transaksi:\n`)
      otherExpenses.forEach(tx => {
        console.log(`${tx.date.toLocaleDateString('id-ID')} - ${tx.category}`)
        console.log(`  ${tx.description}`)
        console.log(`  Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
        console.log()
      })
    } else {
      console.log('Tidak ada cash expense selain SALARY dan PO\n')
      console.log('⚠️ Ini berarti project expenses TIDAK dicatat di cashflow!')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProjectExpensesCashflow()
