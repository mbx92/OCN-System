import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Mencari transaksi PAY-202601-016...\n')

    // Cari transaksi pembayaran teknisi
    const payment = await prisma.technicianPayment.findFirst({
      where: {
        paymentNumber: {
          startsWith: 'PAY-202601-016',
        },
      },
      include: {
        technician: true,
        project: {
          select: {
            projectNumber: true,
            title: true,
            status: true,
          },
        },
      },
    })

    if (!payment) {
      console.log('❌ Transaksi tidak ditemukan')
      return
    }

    console.log('✅ Transaksi ditemukan:')
    console.log('='.repeat(80))
    console.log(`ID: ${payment.id}`)
    console.log(`No. Pembayaran: ${payment.paymentNumber}`)
    console.log(`Teknisi: ${payment.technician?.name || 'N/A'}`)
    console.log(
      `Project: ${payment.project?.projectNumber || 'N/A'} - ${payment.project?.title || ''}`
    )
    console.log(`Status Project: ${payment.project?.status || 'N/A'}`)
    console.log(`Jumlah: Rp ${Number(payment.amount).toLocaleString('id-ID')}`)
    console.log(`Status: ${payment.status}`)
    console.log(`Periode: ${payment.period || 'N/A'}`)
    console.log(
      `Tanggal Dibayar: ${payment.paidDate ? payment.paidDate.toLocaleDateString('id-ID') : 'Belum dibayar'}`
    )
    console.log(`Deskripsi: ${payment.description || '-'}`)
    console.log(`Dibuat: ${payment.createdAt.toLocaleDateString('id-ID')}`)
    console.log('='.repeat(80))

    // Cari semua pembayaran teknisi dan cek apakah ada masalah dengan amount
    console.log('\n🔍 Mengecek semua pembayaran teknisi untuk masalah data...\n')

    const allPayments = await prisma.technicianPayment.findMany({
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    let issueCount = 0

    for (const p of allPayments) {
      const amount = Number(p.amount)
      if (isNaN(amount) || amount === 0 || amount < 0 || amount > 1000000000) {
        console.log(`⚠️  MASALAH: ${p.paymentNumber} - Amount: ${p.amount} (${typeof p.amount})`)
        issueCount++
      }
    }

    if (issueCount === 0) {
      console.log('✅ Tidak ada masalah dengan data amount')
    } else {
      console.log(`\n⚠️  Ditemukan ${issueCount} pembayaran dengan masalah amount`)
    }

    // Hitung total dengan benar
    console.log('\n📊 Statistik Pembayaran Teknisi:\n')

    const stats = await prisma.technicianPayment.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    const statsByStatus = await prisma.technicianPayment.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    })

    console.log(`Total Pembayaran: ${stats._count.id}`)
    console.log(`Total Amount: Rp ${Number(stats._sum.amount || 0).toLocaleString('id-ID')}`)
    console.log('\nPer Status:')
    for (const stat of statsByStatus) {
      console.log(
        `  - ${stat.status}: ${stat._count.id} transaksi, Rp ${Number(stat._sum.amount || 0).toLocaleString('id-ID')}`
      )
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
