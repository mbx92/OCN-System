import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Mencari pembayaran teknisi PAY-202601-016...\n')

    // Cari pembayaran teknisi
    const payment = await prisma.technicianPayment.findFirst({
      where: {
        paymentNumber: {
          startsWith: 'PAY-202601-016',
        },
      },
      include: {
        technician: true,
        project: true,
      },
    })

    if (!payment) {
      console.log('❌ Pembayaran tidak ditemukan')
      return
    }

    console.log('✅ Data Pembayaran Teknisi:')
    console.log('='.repeat(80))
    console.log(`ID: ${payment.id}`)
    console.log(`No. Pembayaran: ${payment.paymentNumber}`)
    console.log(`Teknisi: ${payment.technician?.name}`)
    console.log(`Jumlah: Rp ${Number(payment.amount).toLocaleString('id-ID')}`)
    console.log(`Status: ${payment.status}`)
    console.log(
      `Tanggal Dibayar (paidDate): ${payment.paidDate ? payment.paidDate.toLocaleString('id-ID') : 'N/A'}`
    )
    console.log(`Tanggal Dibuat (createdAt): ${payment.createdAt.toLocaleString('id-ID')}`)
    console.log('='.repeat(80))

    // Cari transaksi cashflow yang terkait
    console.log('\n🔍 Mencari transaksi cashflow terkait...\n')

    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        OR: [
          { referenceId: payment.id },
          { reference: payment.paymentNumber },
          {
            description: {
              contains: payment.paymentNumber,
            },
          },
          {
            description: {
              contains: payment.technician?.name || '',
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (cashTransactions.length === 0) {
      console.log('⚠️  TIDAK ADA transaksi cashflow yang terkait!')
      console.log('\nKemungkinan penyebab:')
      console.log('1. Pembayaran ini dibuat sebelum fitur sync ke cashflow diaktifkan')
      console.log('2. Status pembayaran belum PAID saat dibuat')
      console.log('3. Ada error saat membuat transaksi cashflow')
    } else {
      console.log(`✅ Ditemukan ${cashTransactions.length} transaksi cashflow:\n`)

      for (const tx of cashTransactions) {
        console.log('='.repeat(80))
        console.log(`ID: ${tx.id}`)
        console.log(`Type: ${tx.type}`)
        console.log(`Category: ${tx.category}`)
        console.log(`Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
        console.log(`Description: ${tx.description}`)
        console.log(`Reference: ${tx.reference || 'N/A'}`)
        console.log(`Reference Type: ${tx.referenceType || 'N/A'}`)
        console.log(`Reference ID: ${tx.referenceId || 'N/A'}`)
        console.log(`Tanggal Transaksi (date): ${tx.date.toLocaleString('id-ID')}`)
        console.log(`Tanggal Dibuat (createdAt): ${tx.createdAt.toLocaleString('id-ID')}`)
        console.log('='.repeat(80))

        // Cek apakah tanggal berbeda
        const paymentDate = payment.paidDate || payment.createdAt
        const cashDate = tx.date

        if (paymentDate.getTime() !== cashDate.getTime()) {
          console.log('\n⚠️  KETIDAKSESUAIAN TANGGAL:')
          console.log(
            `   Tanggal Pembayaran: ${paymentDate.toLocaleDateString('id-ID')} ${paymentDate.toLocaleTimeString('id-ID')}`
          )
          console.log(
            `   Tanggal Cashflow: ${cashDate.toLocaleDateString('id-ID')} ${cashDate.toLocaleTimeString('id-ID')}`
          )
          console.log(
            `   Selisih: ${Math.abs(paymentDate.getTime() - cashDate.getTime()) / (1000 * 60 * 60 * 24)} hari`
          )
        } else {
          console.log('\n✅ Tanggal sudah sesuai')
        }
        console.log()
      }
    }

    // Cari semua transaksi cashflow gaji teknisi di Januari 2026
    console.log('\n🔍 Mencari semua transaksi gaji teknisi di Januari 2026...\n')

    const janCashTransactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'EXPENSE',
        category: 'SALARY',
        date: {
          gte: new Date('2026-01-01'),
          lt: new Date('2026-02-01'),
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    console.log(`Ditemukan ${janCashTransactions.length} transaksi gaji teknisi di Januari 2026:\n`)

    for (const tx of janCashTransactions) {
      console.log(
        `- ${tx.date.toLocaleDateString('id-ID')} | Rp ${Number(tx.amount).toLocaleString('id-ID')} | ${tx.description} | Ref: ${tx.reference || 'N/A'}`
      )
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
