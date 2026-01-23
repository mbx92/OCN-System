import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Mencari transaksi cashflow gaji teknisi dengan tanggal yang salah...\n')

    // Ambil semua transaksi cashflow gaji teknisi yang punya referenceId
    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'EXPENSE',
        category: 'SALARY',
        referenceType: 'TechnicianPayment',
        referenceId: {
          not: null,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    console.log(`Ditemukan ${cashTransactions.length} transaksi cashflow gaji teknisi\n`)

    const issues: Array<{
      cashId: string
      paymentNumber: string
      cashDate: Date
      correctDate: Date
      technicianName: string
      amount: number
    }> = []

    // Cek setiap transaksi
    for (const tx of cashTransactions) {
      const payment = await prisma.technicianPayment.findUnique({
        where: { id: tx.referenceId! },
        include: {
          technician: true,
        },
      })

      if (!payment) {
        console.log(`⚠️  Payment ${tx.reference} tidak ditemukan`)
        continue
      }

      const correctDate = payment.paidDate || payment.createdAt
      const cashDate = tx.date

      // Cek apakah tanggalnya berbeda (bandingkan tanggal saja, ignore jam)
      const correctDateStr = correctDate.toISOString().split('T')[0]
      const cashDateStr = cashDate.toISOString().split('T')[0]

      if (correctDateStr !== cashDateStr) {
        issues.push({
          cashId: tx.id,
          paymentNumber: payment.paymentNumber,
          cashDate: cashDate,
          correctDate: correctDate,
          technicianName: payment.technician?.name || 'N/A',
          amount: Number(tx.amount),
        })
      }
    }

    console.log(`\n⚠️  Ditemukan ${issues.length} transaksi dengan tanggal yang salah:\n`)

    if (issues.length === 0) {
      console.log('✅ Semua tanggal sudah benar!')
      return
    }

    console.log('='.repeat(100))
    for (const issue of issues) {
      console.log(`Payment: ${issue.paymentNumber}`)
      console.log(`Teknisi: ${issue.technicianName}`)
      console.log(`Amount: Rp ${issue.amount.toLocaleString('id-ID')}`)
      console.log(`Tanggal Cashflow (SALAH): ${issue.cashDate.toLocaleDateString('id-ID')}`)
      console.log(`Tanggal Seharusnya: ${issue.correctDate.toLocaleDateString('id-ID')}`)
      console.log('='.repeat(100))
    }

    // Konfirmasi
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>(resolve => {
      rl.question('\n❓ Lanjutkan perbaiki tanggal? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Update dibatalkan.')
      return
    }

    // Update data
    console.log('\n🔄 Memulai update...\n')
    let updated = 0

    for (const issue of issues) {
      await prisma.cashTransaction.update({
        where: { id: issue.cashId },
        data: {
          date: issue.correctDate,
        },
      })
      console.log(
        `✅ Updated: ${issue.paymentNumber} - ${issue.correctDate.toLocaleDateString('id-ID')}`
      )
      updated++
    }

    console.log('\n' + '='.repeat(100))
    console.log(`\n✨ Selesai!`)
    console.log(`   - ${updated} transaksi berhasil diupdate`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
