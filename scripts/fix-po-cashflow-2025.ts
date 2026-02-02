import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPOCashflow() {
  try {
    console.log('=== FIX CASHFLOW UNTUK PO YANG SUDAH RECEIVED ===\n')

    // Get all RECEIVED POs that don't have cashflow record
    const receivedPOs = await prisma.purchaseOrder.findMany({
      where: {
        status: 'RECEIVED',
      },
      include: {
        supplier: true,
        project: { select: { projectNumber: true } },
      },
      orderBy: { receivedDate: 'asc' },
    })

    console.log(`Total PO dengan status RECEIVED: ${receivedPOs.length}\n`)

    // Check which ones don't have cashflow
    const missingCashflow: typeof receivedPOs = []

    for (const po of receivedPOs) {
      const existingCashTx = await prisma.cashTransaction.findFirst({
        where: {
          referenceId: po.id,
          referenceType: 'PurchaseOrder',
        },
      })

      if (!existingCashTx) {
        missingCashflow.push(po)
      }
    }

    console.log(`PO yang belum punya cashflow: ${missingCashflow.length}\n`)

    if (missingCashflow.length === 0) {
      console.log('✅ Semua PO sudah tercatat di cashflow\n')
      return
    }

    console.log('Detail PO yang akan dibuatkan cashflow:\n')
    console.log('═'.repeat(80))

    let totalAmount = 0
    missingCashflow.forEach((po, idx) => {
      console.log(`${idx + 1}. ${po.poNumber}`)
      console.log(`   Supplier: ${po.supplier.name}`)
      console.log(`   Project: ${po.project?.projectNumber || 'Direct PO'}`)
      console.log(`   Amount: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
      console.log(`   Received Date: ${po.receivedDate?.toLocaleDateString('id-ID') || '-'}`)
      totalAmount += Number(po.totalAmount)
      console.log()
    })

    console.log('═'.repeat(80))
    console.log(`TOTAL yang akan dicatat: Rp ${totalAmount.toLocaleString('id-ID')}\n`)

    console.log('⚠️ PENJELASAN:')
    console.log('━'.repeat(80))
    console.log('PO ini sudah RECEIVED tapi belum tercatat di cashflow.')
    console.log('Ini membuat:')
    console.log('1. Cashflow tidak akurat (pengeluaran tidak tercatat)')
    console.log('2. HPP di laba rugi sudah dicatat, tapi kas tidak berkurang')
    console.log('3. Selisih cashflow vs laba rugi jadi besar')
    console.log('')
    console.log('Setelah fix:')
    console.log('- Cashflow akan mencatat pengeluaran PO')
    console.log('- Selisih cashflow vs laba rugi akan normal')
    console.log('━'.repeat(80) + '\n')

    // Ask for confirmation
    const args = process.argv.slice(2)
    const isConfirmed = args.includes('--confirm')

    if (!isConfirmed) {
      console.log('❌ Tidak ada konfirmasi. Jalankan dengan:')
      console.log('   npx tsx scripts/fix-po-cashflow-2025.ts --confirm\n')
      return
    }

    console.log('\n🔄 Membuat cashflow transactions...\n')

    let created = 0
    for (const po of missingCashflow) {
      // Use received date or created date
      const transactionDate = po.receivedDate || po.createdAt

      await prisma.cashTransaction.create({
        data: {
          type: 'EXPENSE',
          category: 'PO',
          amount: po.totalAmount,
          description: `Pembelian ${po.poNumber}`,
          reference: po.poNumber,
          referenceType: 'PurchaseOrder',
          referenceId: po.id,
          date: transactionDate,
        },
      })

      created++
      console.log(`✓ ${po.poNumber} - Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
    }

    console.log(`\n✅ Berhasil membuat ${created} cashflow transactions\n`)

    // Verify
    console.log('=== VERIFIKASI SETELAH PERBAIKAN ===\n')

    const poCashTx = await prisma.cashTransaction.findMany({
      where: {
        category: 'PO',
        type: 'EXPENSE',
      },
    })

    const totalPOCash = poCashTx.reduce((sum, tx) => sum + Number(tx.amount), 0)

    console.log(`Total Cash Transaction PO: ${poCashTx.length}`)
    console.log(`Total Amount: Rp ${totalPOCash.toLocaleString('id-ID')}\n`)

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

fixPOCashflow()
