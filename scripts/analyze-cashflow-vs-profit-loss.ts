import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeCashflowVsProfitLoss() {
  try {
    const year = 2025

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== ANALISIS PERBEDAAN CASHFLOW VS LABA RUGI 2025 ===')
    console.log(
      `Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}\n`
    )

    // ============================================
    // CASHFLOW CALCULATION (Basis Kas)
    // ============================================
    console.log('█████████████████████████████████████████████████')
    console.log('█  CASHFLOW (BASIS KAS - UANG MASUK & KELUAR)  █')
    console.log('█████████████████████████████████████████████████\n')

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
    const cashFlowBalance = totalCashIncome - totalCashExpense

    console.log('💰 PEMASUKAN KAS:')
    console.log(`   Total Transaksi: ${cashIncome.length}`)
    const incomeByCategory: { [key: string]: { count: number; amount: number } } = {}
    cashIncome.forEach(tx => {
      if (!incomeByCategory[tx.category]) {
        incomeByCategory[tx.category] = { count: 0, amount: 0 }
      }
      incomeByCategory[tx.category].count++
      incomeByCategory[tx.category].amount += Number(tx.amount)
    })
    Object.entries(incomeByCategory).forEach(([category, data]) => {
      console.log(
        `   - ${category}: Rp ${data.amount.toLocaleString('id-ID')} (${data.count} transaksi)`
      )
    })
    console.log(`   TOTAL PEMASUKAN KAS: Rp ${totalCashIncome.toLocaleString('id-ID')}\n`)

    console.log('💸 PENGELUARAN KAS:')
    console.log(`   Total Transaksi: ${cashExpense.length}`)
    const expenseByCategory: { [key: string]: { count: number; amount: number } } = {}
    cashExpense.forEach(tx => {
      if (!expenseByCategory[tx.category]) {
        expenseByCategory[tx.category] = { count: 0, amount: 0 }
      }
      expenseByCategory[tx.category].count++
      expenseByCategory[tx.category].amount += Number(tx.amount)
    })
    Object.entries(expenseByCategory).forEach(([category, data]) => {
      console.log(
        `   - ${category}: Rp ${data.amount.toLocaleString('id-ID')} (${data.count} transaksi)`
      )
    })
    console.log(`   TOTAL PENGELUARAN KAS: Rp ${totalCashExpense.toLocaleString('id-ID')}\n`)

    console.log('═══════════════════════════════════════')
    console.log(`💵 SALDO CASHFLOW: Rp ${cashFlowBalance.toLocaleString('id-ID')}`)
    console.log('═══════════════════════════════════════\n\n')

    // ============================================
    // LABA RUGI CALCULATION (Basis Akrual)
    // ============================================
    console.log('█████████████████████████████████████████████████')
    console.log('█  LABA RUGI (BASIS AKRUAL - PENDAPATAN & HPP) █')
    console.log('█████████████████████████████████████████████████\n')

    // 1. PENDAPATAN (dari Payments)
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

    console.log('📊 PENDAPATAN (dari Payments):')
    console.log(`   Total Payments: ${validPayments.length}`)
    console.log(`   TOTAL PENDAPATAN: Rp ${totalPendapatan.toLocaleString('id-ID')}\n`)

    // 2. HPP (dari Project Items & Project Expenses)
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

    console.log('📦 HPP (Harga Pokok Penjualan):')
    console.log(`   Total Projects: ${projects.length}`)
    console.log(`   - Biaya Items/Material: Rp ${totalItemsCost.toLocaleString('id-ID')}`)
    console.log(`   - Biaya Project Expenses: Rp ${totalProjectExpenses.toLocaleString('id-ID')}`)
    console.log(`   TOTAL HPP: Rp ${totalHPP.toLocaleString('id-ID')}\n`)

    const labaKotor = totalPendapatan - totalHPP
    console.log(`💰 LABA KOTOR: Rp ${labaKotor.toLocaleString('id-ID')}\n`)

    // 3. BIAYA OPERASIONAL (dari Expenses non-PROJECT & Cash Transactions)
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

    // Cash transactions (exclude PO and PAYMENT)
    const otherCashExpenses = cashExpense.filter(ct => !['PO', 'PAYMENT'].includes(ct.category))
    const totalCashOps = otherCashExpenses.reduce((sum, ct) => sum + Number(ct.amount), 0)

    const totalBiayaOperasional = totalExpenses + totalCashOps

    console.log('💼 BIAYA OPERASIONAL:')
    console.log(`   - Dari Expenses table: Rp ${totalExpenses.toLocaleString('id-ID')}`)
    console.log(`   - Dari Cash Transactions: Rp ${totalCashOps.toLocaleString('id-ID')}`)
    console.log(`   TOTAL BIAYA OPERASIONAL: Rp ${totalBiayaOperasional.toLocaleString('id-ID')}\n`)

    const labaBersih = labaKotor - totalBiayaOperasional

    console.log('═══════════════════════════════════════')
    console.log(`📈 LABA BERSIH: Rp ${labaBersih.toLocaleString('id-ID')}`)
    console.log('═══════════════════════════════════════\n\n')

    // ============================================
    // ANALISIS PERBEDAAN
    // ============================================
    console.log('█████████████████████████████████████████████████')
    console.log('█     ANALISIS PERBEDAAN CASHFLOW VS LABA      █')
    console.log('█████████████████████████████████████████████████\n')

    const selisih = cashFlowBalance - labaBersih

    console.log(`💵 Saldo Cashflow:  Rp ${cashFlowBalance.toLocaleString('id-ID')}`)
    console.log(`📈 Laba Bersih:     Rp ${labaBersih.toLocaleString('id-ID')}`)
    console.log(`➖ Selisih:        Rp ${selisih.toLocaleString('id-ID')}\n`)

    console.log('🔍 PENYEBAB UTAMA PERBEDAAN:\n')

    // 1. Pemasukan Kas vs Pendapatan
    const diffIncome = totalCashIncome - totalPendapatan
    console.log('1️⃣ PEMASUKAN KAS vs PENDAPATAN:')
    console.log(`   Pemasukan Kas:  Rp ${totalCashIncome.toLocaleString('id-ID')}`)
    console.log(`   Pendapatan:     Rp ${totalPendapatan.toLocaleString('id-ID')}`)
    console.log(`   Selisih:        Rp ${diffIncome.toLocaleString('id-ID')}`)
    if (diffIncome > 0) {
      console.log(
        '   ⚠️ Pemasukan kas LEBIH BESAR dari pendapatan (mungkin ada penerimaan non-operasional)\n'
      )
    } else if (diffIncome < 0) {
      console.log(
        '   ⚠️ Pemasukan kas LEBIH KECIL dari pendapatan (mungkin ada piutang belum dibayar)\n'
      )
    }

    // 2. Pengeluaran Kas vs HPP + Biaya Operasional
    const totalLabaRugiExpense = totalHPP + totalBiayaOperasional
    const diffExpense = totalCashExpense - totalLabaRugiExpense
    console.log('2️⃣ PENGELUARAN KAS vs (HPP + BIAYA OPERASIONAL):')
    console.log(`   Pengeluaran Kas:       Rp ${totalCashExpense.toLocaleString('id-ID')}`)
    console.log(`   HPP + Biaya Ops:       Rp ${totalLabaRugiExpense.toLocaleString('id-ID')}`)
    console.log(`   Selisih:               Rp ${diffExpense.toLocaleString('id-ID')}`)
    if (diffExpense > 0) {
      console.log(
        '   ⚠️ Pengeluaran kas LEBIH BESAR (mungkin ada pembelian aset atau utang dibayar)\n'
      )
    } else if (diffExpense < 0) {
      console.log(
        '   ⚠️ Pengeluaran kas LEBIH KECIL (mungkin ada biaya yang dicatat tapi belum dibayar)\n'
      )
    }

    // 3. Cek kategori yang mungkin menyebabkan perbedaan
    console.log('3️⃣ KATEGORI PENGELUARAN KAS YANG TIDAK MASUK LABA RUGI:')

    // Cek PO (Purchase Order) - ini masuk cashflow tapi tidak masuk laba rugi langsung
    const poCashTx = cashExpense.filter(ct => ct.category === 'PO')
    const totalPO = poCashTx.reduce((sum, ct) => sum + Number(ct.amount), 0)
    if (totalPO > 0) {
      console.log(`   - PO (Purchase Order): Rp ${totalPO.toLocaleString('id-ID')}`)
      console.log(
        '     (PO = pembelian barang, masuk HPP saat barang dipakai di project, bukan saat dibeli)\n'
      )
    }

    // Cek ASSET - pembelian aset masuk cashflow tapi tidak masuk laba rugi
    const assetCashTx = cashExpense.filter(ct => ct.category === 'ASSET')
    const totalAsset = assetCashTx.reduce((sum, ct) => sum + Number(ct.amount), 0)
    if (totalAsset > 0) {
      console.log(`   - ASSET (Pembelian Aset): Rp ${totalAsset.toLocaleString('id-ID')}`)
      console.log('     (Aset = pengeluaran kas, tapi bukan biaya di laba rugi)\n')
    }

    // Cek PAYMENT - pembayaran utang
    const paymentCashTx = cashExpense.filter(ct => ct.category === 'PAYMENT')
    const totalPayment = paymentCashTx.reduce((sum, ct) => sum + Number(ct.amount), 0)
    if (totalPayment > 0) {
      console.log(`   - PAYMENT (Pembayaran): Rp ${totalPayment.toLocaleString('id-ID')}`)
      console.log('     (Pembayaran utang = keluar kas, tapi bukan biaya)\n')
    }

    console.log('\n📋 KESIMPULAN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(
      'Perbedaan antara Cashflow dan Laba Rugi adalah NORMAL karena menggunakan basis yang berbeda:'
    )
    console.log('• CASHFLOW   = Basis KAS (uang masuk & keluar secara fisik)')
    console.log('• LABA RUGI  = Basis AKRUAL (pendapatan & biaya saat terjadi transaksi)')
    console.log('')
    console.log('Penyebab utama selisih:')
    console.log('1. Pembelian PO = keluar kas, tapi masuk HPP saat barang dipakai')
    console.log('2. Pembelian Aset = keluar kas, tapi bukan biaya (aset dicatat di neraca)')
    console.log('3. Pembayaran Utang = keluar kas, tapi bukan biaya (mengurangi utang)')
    console.log('4. Piutang = pendapatan dicatat, tapi kas belum masuk')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeCashflowVsProfitLoss()
