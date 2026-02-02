import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixProjectExpensesCashflow() {
  try {
    console.log('=== FIX PROJECT EXPENSES CASHFLOW ===\n')

    // Get all project expenses that don't have cashflow
    const projectExpenses = await prisma.projectExpense.findMany({
      include: {
        project: { select: { projectNumber: true, status: true } },
      },
      orderBy: { date: 'asc' },
    })

    // Filter valid expenses (not from cancelled projects)
    const validExpenses = projectExpenses.filter(
      e => !e.project || e.project.status !== 'CANCELLED'
    )

    console.log(`Total Project Expenses: ${validExpenses.length}\n`)

    if (validExpenses.length === 0) {
      console.log('Tidak ada project expenses')
      return
    }

    // Check which ones don't have cashflow
    const missingCashflow: typeof validExpenses = []

    for (const exp of validExpenses) {
      const existingCashTx = await prisma.cashTransaction.findFirst({
        where: {
          referenceId: exp.id,
          referenceType: 'ProjectExpense',
        },
      })

      if (!existingCashTx) {
        missingCashflow.push(exp)
      }
    }

    console.log(`Project Expenses belum tercatat di cashflow: ${missingCashflow.length}\n`)

    if (missingCashflow.length === 0) {
      console.log('✅ Semua project expenses sudah tercatat di cashflow\n')
      return
    }

    console.log('Detail yang akan ditambahkan:\n')
    console.log('═'.repeat(80))

    const totalAmount = missingCashflow.reduce((sum, e) => sum + Number(e.amount), 0)

    missingCashflow.forEach((exp, idx) => {
      console.log(
        `${idx + 1}. ${exp.project.projectNumber} - ${exp.date.toLocaleDateString('id-ID')}`
      )
      console.log(`   ${exp.description}`)
      console.log(`   Rp ${Number(exp.amount).toLocaleString('id-ID')}`)
      console.log()
    })

    console.log('═'.repeat(80))
    console.log(`TOTAL yang akan dicatat: Rp ${totalAmount.toLocaleString('id-ID')}\n`)

    console.log('⚠️ PENJELASAN:')
    console.log('━'.repeat(80))
    console.log('Project Expenses adalah biaya langsung project (makan, transport, dll).')
    console.log('Biaya ini:')
    console.log('1. Sudah dicatat di HPP (Laba Rugi)')
    console.log('2. HARUS dicatat di Cashflow karena uang benar-benar keluar')
    console.log('')
    console.log('Setelah fix:')
    console.log('- Cashflow akan mencatat pengeluaran project expenses')
    console.log('- Selisih cashflow vs laba rugi akan lebih kecil')
    console.log('━'.repeat(80) + '\n')

    // Ask for confirmation
    const args = process.argv.slice(2)
    const isConfirmed = args.includes('--confirm')

    if (!isConfirmed) {
      console.log('❌ Tidak ada konfirmasi. Jalankan dengan:')
      console.log('   npx tsx scripts/fix-project-expenses-cashflow.ts --confirm\n')
      return
    }

    console.log('\n🔄 Membuat cashflow transactions...\n')

    let created = 0
    for (const exp of missingCashflow) {
      await prisma.cashTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'PROJECT_EXPENSE',
          amount: exp.amount,
          description: `${exp.description} - ${exp.project.projectNumber}`,
          reference: exp.project.projectNumber,
          referenceType: 'ProjectExpense',
          referenceId: exp.id,
          date: exp.date,
        },
      })

      created++
      console.log(
        `✓ ${exp.project.projectNumber} - ${exp.date.toLocaleDateString('id-ID')} - Rp ${Number(exp.amount).toLocaleString('id-ID')}`
      )
    }

    console.log(`\n✅ Berhasil membuat ${created} cashflow transactions\n`)

    // Verify
    console.log('=== VERIFIKASI SETELAH PERBAIKAN ===\n')

    const projectExpenseCashTx = await prisma.cashTransaction.findMany({
      where: {
        category: 'PROJECT_EXPENSE',
        type: 'EXPENSE',
      },
    })

    const totalProjectExpenseCash = projectExpenseCashTx.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    )

    console.log(`Total Cash Transaction PROJECT_EXPENSE: ${projectExpenseCashTx.length}`)
    console.log(`Total Amount: Rp ${totalProjectExpenseCash.toLocaleString('id-ID')}\n`)

    // Calculate new cashflow balance
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    const [income, expense] = await Promise.all([
      prisma.cashTransaction.aggregate({
        where: { date: { gte: startDate, lte: endDate }, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.cashTransaction.aggregate({
        where: { date: { gte: startDate, lte: endDate }, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = Number(income._sum.amount || 0)
    const totalExpense = Number(expense._sum.amount || 0)
    const balance = totalIncome - totalExpense

    console.log('=== CASHFLOW 2025 SETELAH FIX ===')
    console.log(`Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}`)
    console.log(`Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`)
    console.log(`SALDO: Rp ${balance.toLocaleString('id-ID')}\n`)

    console.log('✅ PERBAIKAN SELESAI!\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixProjectExpensesCashflow()
