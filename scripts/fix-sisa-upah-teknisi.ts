import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSisaUpahTechnician() {
  try {
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== FIX DOUBLE COUNTING SISA UPAH TEKNISI ===\n')

    // Get all OTHER income that are sisa upah teknisi
    const sisaUpahTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
        category: 'OTHER',
        description: {
          contains: 'Sisa upah teknisi',
        },
      },
      orderBy: { date: 'asc' },
    })

    console.log(`Ditemukan ${sisaUpahTransactions.length} transaksi sisa upah teknisi\n`)

    const totalAmount = sisaUpahTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)

    console.log('Detail transaksi yang akan dihapus:')
    console.log('═══════════════════════════════════════\n')
    sisaUpahTransactions.forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.date.toLocaleDateString('id-ID')}`)
      console.log(`   ${tx.description}`)
      console.log(`   Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
      console.log()
    })

    console.log('═══════════════════════════════════════')
    console.log(`TOTAL yang akan dihapus: Rp ${totalAmount.toLocaleString('id-ID')}\n`)

    console.log('⚠️ PENJELASAN:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Sisa upah teknisi BUKAN pemasukan (income).')
    console.log('Ini adalah selisih antara:')
    console.log('- Fee teknisi yang dianggarkan di project')
    console.log('- Fee yang benar-benar dibayarkan')
    console.log('')
    console.log('Sisa ini seharusnya:')
    console.log('1. Tidak dicatat di cashflow (karena tidak ada uang masuk)')
    console.log('2. ATAU dicatat sebagai pengurangan biaya gaji')
    console.log('')
    console.log('Dengan menghapus transaksi ini:')
    console.log('- Cashflow akan lebih akurat')
    console.log('- Tidak ada double counting')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Ask for confirmation
    console.log('Apakah Anda yakin ingin menghapus transaksi ini?')
    console.log('Ketik "YES" untuk konfirmasi, atau jalankan dengan --confirm flag\n')

    // Check if --confirm flag is present
    const args = process.argv.slice(2)
    const isConfirmed = args.includes('--confirm')

    if (!isConfirmed) {
      console.log('❌ Tidak ada konfirmasi. Jalankan dengan:')
      console.log('   npx tsx scripts/fix-sisa-upah-teknisi.ts --confirm\n')
      return
    }

    // Delete transactions
    console.log('\n🔄 Menghapus transaksi...\n')

    const deleteResult = await prisma.cashTransaction.deleteMany({
      where: {
        id: {
          in: sisaUpahTransactions.map(tx => tx.id),
        },
      },
    })

    console.log(`✅ Berhasil menghapus ${deleteResult.count} transaksi\n`)

    // Verify the fix
    console.log('=== VERIFIKASI SETELAH PERBAIKAN ===\n')

    const remainingOther = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
        category: 'OTHER',
      },
    })

    console.log(`Sisa transaksi OTHER: ${remainingOther.length}`)
    if (remainingOther.length > 0) {
      console.log('Transaksi OTHER yang tersisa:')
      remainingOther.forEach(tx => {
        console.log(`- ${tx.date.toLocaleDateString('id-ID')}: ${tx.description}`)
      })
    } else {
      console.log('✅ Tidak ada lagi transaksi OTHER sisa upah teknisi')
    }

    // Calculate new cashflow
    console.log('\n=== CASHFLOW SETELAH KOREKSI ===\n')

    const allIncome = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
      },
    })

    const allExpense = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'EXPENSE',
      },
    })

    const newTotalIncome = allIncome.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const newTotalExpense = allExpense.reduce((sum, tx) => sum + Number(tx.amount), 0)
    const newBalance = newTotalIncome - newTotalExpense

    console.log(`Total Pemasukan: Rp ${newTotalIncome.toLocaleString('id-ID')}`)
    console.log(`Total Pengeluaran: Rp ${newTotalExpense.toLocaleString('id-ID')}`)
    console.log(`SALDO CASHFLOW BARU: Rp ${newBalance.toLocaleString('id-ID')}\n`)

    console.log('✅ PERBAIKAN SELESAI!\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSisaUpahTechnician()
