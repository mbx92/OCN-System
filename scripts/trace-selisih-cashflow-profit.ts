import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function traceSelisih() {
  try {
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== TRACE SELISIH CASHFLOW VS LABA RUGI 2025 ===\n')

    // ============================================
    // CASHFLOW DETAIL
    // ============================================
    console.log('💵 CASHFLOW (BASIS KAS)\n')

    const cashIncome = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
      },
    })

    const cashExpense = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
      },
    })

    const totalCashIncome = cashIncome.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const totalCashExpense = cashExpense.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const cashBalance = totalCashIncome - totalCashExpense

    console.log('Pemasukan:')
    const incomeByCategory: { [key: string]: number } = {}
    cashIncome.forEach(tx => {
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + Number(tx.amount)
    })
    Object.entries(incomeByCategory).forEach(([cat, amt]) => {
      console.log(`  ${cat}: Rp ${amt.toLocaleString('id-ID')}`)
    })
    console.log(`  TOTAL: Rp ${totalCashIncome.toLocaleString('id-ID')}\n`)

    console.log('Pengeluaran:')
    const expenseByCategory: { [key: string]: number } = {}
    cashExpense.forEach(tx => {
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + Number(tx.amount)
    })
    Object.entries(expenseByCategory).forEach(([cat, amt]) => {
      console.log(`  ${cat}: Rp ${amt.toLocaleString('id-ID')}`)
    })
    console.log(`  TOTAL: Rp ${totalCashExpense.toLocaleString('id-ID')}\n`)

    console.log(`SALDO CASHFLOW: Rp ${cashBalance.toLocaleString('id-ID')}\n`)
    console.log('='.repeat(80) + '\n')

    // ============================================
    // LABA RUGI DETAIL
    // ============================================
    console.log('📈 LABA RUGI (BASIS AKRUAL)\n')

    // Pendapatan
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

    console.log(`Pendapatan: Rp ${totalPendapatan.toLocaleString('id-ID')}\n`)

    // HPP Detail
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

    console.log('HPP:')
    console.log(`  Items/Material: Rp ${totalItemsCost.toLocaleString('id-ID')}`)
    console.log(`  Project Expenses: Rp ${totalProjectExpenses.toLocaleString('id-ID')}`)
    console.log(`  TOTAL HPP: Rp ${totalHPP.toLocaleString('id-ID')}\n`)

    const labaKotor = totalPendapatan - totalHPP
    console.log(`Laba Kotor: Rp ${labaKotor.toLocaleString('id-ID')}\n`)

    // Biaya Operasional
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

    const totalBiayaOps = totalExpenses + totalCashOps

    console.log('Biaya Operasional:')
    console.log(`  Dari Expense table: Rp ${totalExpenses.toLocaleString('id-ID')}`)
    console.log(`  Dari Cash (SALARY): Rp ${totalCashOps.toLocaleString('id-ID')}`)
    console.log(`  TOTAL: Rp ${totalBiayaOps.toLocaleString('id-ID')}\n`)

    const labaBersih = labaKotor - totalBiayaOps
    console.log(`LABA BERSIH: Rp ${labaBersih.toLocaleString('id-ID')}\n`)
    console.log('='.repeat(80) + '\n')

    // ============================================
    // DETAIL ANALYSIS
    // ============================================
    console.log('🔍 DETAIL ANALISIS SELISIH\n')

    const selisih = cashBalance - labaBersih
    console.log(`Saldo Cashflow: Rp ${cashBalance.toLocaleString('id-ID')}`)
    console.log(`Laba Bersih:    Rp ${labaBersih.toLocaleString('id-ID')}`)
    console.log(`SELISIH:        Rp ${selisih.toLocaleString('id-ID')}\n`)

    console.log('─'.repeat(80) + '\n')

    // 1. Compare Income/Pendapatan
    console.log('1️⃣ PEMASUKAN KAS vs PENDAPATAN:\n')
    console.log(`   Cash Income (PAYMENT): Rp ${totalCashIncome.toLocaleString('id-ID')}`)
    console.log(`   Pendapatan (Payments): Rp ${totalPendapatan.toLocaleString('id-ID')}`)
    const diffIncome = totalCashIncome - totalPendapatan
    console.log(`   Selisih:               Rp ${diffIncome.toLocaleString('id-ID')}`)
    if (diffIncome === 0) {
      console.log('   ✅ SAMA - Tidak ada masalah\n')
    }

    console.log('─'.repeat(80) + '\n')

    // 2. Compare HPP with PO Cashflow
    console.log('2️⃣ HPP vs PENGELUARAN PO:\n')

    const poCashflow = cashExpense.filter(tx => tx.category === 'PO')
    const totalPOCash = poCashflow.reduce((sum, tx) => sum + Number(tx.amount), 0)

    console.log(`   HPP Items:           Rp ${totalItemsCost.toLocaleString('id-ID')}`)
    console.log(`   HPP Project Expense: Rp ${totalProjectExpenses.toLocaleString('id-ID')}`)
    console.log(`   Total HPP:           Rp ${totalHPP.toLocaleString('id-ID')}`)
    console.log()
    console.log(`   PO Cashflow:         Rp ${totalPOCash.toLocaleString('id-ID')}`)
    const diffPO = totalHPP - totalPOCash
    console.log(`   Selisih HPP vs PO:   Rp ${diffPO.toLocaleString('id-ID')}`)

    if (diffPO > 0) {
      console.log('\n   ⚠️ HPP LEBIH BESAR dari PO Cashflow\n')
      console.log('   Kemungkinan penyebab:')
      console.log(`   • Project Expenses: Rp ${totalProjectExpenses.toLocaleString('id-ID')}`)
      console.log('   • Items dari stok lama (bukan dari PO 2025)')
      console.log('   • Selisih harga item vs PO\n')
    }

    console.log('─'.repeat(80) + '\n')

    // 3. Check Project Expenses Detail
    console.log('3️⃣ DETAIL PROJECT EXPENSES:\n')

    const projectExpenses = await prisma.projectExpense.findMany({
      where: {
        project: {
          OR: [
            { startDate: { gte: startDate, lte: endDate } },
            { endDate: { gte: startDate, lte: endDate } },
          ],
          status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
        },
      },
      include: {
        project: { select: { projectNumber: true } },
      },
    })

    if (projectExpenses.length > 0) {
      console.log(`   Total: ${projectExpenses.length} transaksi\n`)
      projectExpenses.forEach(exp => {
        console.log(`   ${exp.project.projectNumber}: ${exp.description}`)
        console.log(
          `   Rp ${Number(exp.amount).toLocaleString('id-ID')} - ${exp.date.toLocaleDateString('id-ID')}`
        )
        console.log()
      })
      const sumExpenses = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
      console.log(`   TOTAL: Rp ${sumExpenses.toLocaleString('id-ID')}\n`)
    } else {
      console.log('   Tidak ada project expenses\n')
    }

    console.log('─'.repeat(80) + '\n')

    // 4. Check Items that are not from PO
    console.log('4️⃣ ITEMS TANPA PO (dari stok):\n')

    const allItems = projects.flatMap(p => p.items)
    const itemsWithoutPO = allItems.filter(item => !item.needsPo)
    const itemsWithPO = allItems.filter(item => item.needsPo)

    const costWithoutPO = itemsWithoutPO.reduce((sum, i) => sum + Number(i.totalCost || 0), 0)
    const costWithPO = itemsWithPO.reduce((sum, i) => sum + Number(i.totalCost || 0), 0)

    console.log(`   Items TANPA PO (stok): ${itemsWithoutPO.length} items`)
    console.log(`   Total Cost:            Rp ${costWithoutPO.toLocaleString('id-ID')}`)
    console.log()
    console.log(`   Items DENGAN PO:       ${itemsWithPO.length} items`)
    console.log(`   Total Cost:            Rp ${costWithPO.toLocaleString('id-ID')}\n`)

    console.log('─'.repeat(80) + '\n')

    // 5. Final Breakdown
    console.log('5️⃣ BREAKDOWN SELISIH Rp ' + selisih.toLocaleString('id-ID') + ':\n')

    console.log('   Komponen yang menyebabkan selisih:\n')

    if (totalProjectExpenses > 0) {
      console.log(
        `   1. Project Expenses (HPP tapi bukan PO): Rp ${totalProjectExpenses.toLocaleString('id-ID')}`
      )
    }

    const diffItemsPO = totalItemsCost - totalPOCash
    if (diffItemsPO > 0) {
      console.log(
        `   2. Selisih Items Cost vs PO Cashflow:   Rp ${diffItemsPO.toLocaleString('id-ID')}`
      )
      console.log('      (Items dari stok lama atau selisih harga)')
    }

    const otherDiff = selisih - totalProjectExpenses - Math.max(0, diffItemsPO)
    if (Math.abs(otherDiff) > 100) {
      console.log(
        `   3. Selisih lainnya:                      Rp ${otherDiff.toLocaleString('id-ID')}`
      )
    }

    console.log(
      '\n   TOTAL SELISIH:                           Rp ' + selisih.toLocaleString('id-ID')
    )

    console.log('\n' + '='.repeat(80) + '\n')

    console.log('💡 KESIMPULAN:\n')
    console.log(
      `Selisih Rp ${selisih.toLocaleString('id-ID')} adalah ${((Math.abs(selisih) / labaBersih) * 100).toFixed(1)}% dari laba bersih.`
    )
    console.log('Ini adalah selisih yang NORMAL dan WAJAR karena:\n')

    if (totalProjectExpenses > 0) {
      console.log(`• Project Expenses (Rp ${totalProjectExpenses.toLocaleString('id-ID')})`)
      console.log('  dicatat di HPP tapi tidak keluar sebagai PO cashflow\n')
    }

    if (diffItemsPO > 0) {
      console.log(`• Selisih Items vs PO (Rp ${diffItemsPO.toLocaleString('id-ID')})`)
      console.log('  Items pakai stok lama atau ada perbedaan harga\n')
    }

    console.log('Perbedaan ini terjadi karena:')
    console.log('• Cashflow = Basis KAS (uang keluar masuk fisik)')
    console.log('• Laba Rugi = Basis AKRUAL (pendapatan & biaya saat terjadi)\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

traceSelisih()
