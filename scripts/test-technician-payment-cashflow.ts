import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧪 Testing: Membuat pembayaran teknisi dengan tanggal custom\n')
    console.log('Test Case: Membuat pembayaran dengan paidDate 15 Desember 2025\n')

    // Cari teknisi pertama
    const technician = await prisma.technician.findFirst({
      select: {
        id: true,
        name: true,
      },
    })

    if (!technician) {
      console.log('❌ Tidak ada teknisi dalam database')
      return
    }

    console.log(`✅ Menggunakan teknisi: ${technician.name}`)

    // Buat pembayaran dengan status PAID dan paidDate custom
    const testDate = new Date('2025-12-15T08:00:00')

    const payment = await prisma.technicianPayment.create({
      data: {
        paymentNumber: 'TEST-' + Date.now(),
        technicianId: technician.id,
        amount: 100000,
        description: 'TEST - Pembayaran dengan tanggal custom',
        status: 'PAID',
        paidDate: testDate,
        period: '2025-12',
      },
    })

    console.log(`\n✅ Pembayaran berhasil dibuat:`)
    console.log(`   Payment ID: ${payment.id}`)
    console.log(`   Payment Number: ${payment.paymentNumber}`)
    console.log(`   Paid Date: ${payment.paidDate?.toLocaleDateString('id-ID')}`)

    // Cek apakah cashflow sudah dibuat dengan tanggal yang benar
    await new Promise(resolve => setTimeout(resolve, 1000)) // tunggu sebentar

    const cashTransaction = await prisma.cashTransaction.findFirst({
      where: {
        referenceId: payment.id,
        referenceType: 'TechnicianPayment',
      },
    })

    if (!cashTransaction) {
      console.log('\n❌ GAGAL: Cashflow tidak dibuat!')
      return
    }

    console.log(`\n✅ Cashflow berhasil dibuat:`)
    console.log(`   Cash ID: ${cashTransaction.id}`)
    console.log(`   Amount: Rp ${Number(cashTransaction.amount).toLocaleString('id-ID')}`)
    console.log(`   Cash Date: ${cashTransaction.date.toLocaleDateString('id-ID')}`)

    // Verifikasi tanggal sama
    const paymentDateStr = payment.paidDate!.toISOString().split('T')[0]
    const cashDateStr = cashTransaction.date.toISOString().split('T')[0]

    if (paymentDateStr === cashDateStr) {
      console.log('\n✅ ✅ ✅ TEST PASSED: Tanggal cashflow SUDAH BENAR!')
      console.log(`   Payment Date: ${paymentDateStr}`)
      console.log(`   Cash Date: ${cashDateStr}`)
    } else {
      console.log('\n❌ ❌ ❌ TEST FAILED: Tanggal cashflow SALAH!')
      console.log(`   Expected: ${paymentDateStr}`)
      console.log(`   Actual: ${cashDateStr}`)
    }

    // Cleanup - hapus data test
    console.log('\n🧹 Cleaning up test data...')
    await prisma.cashTransaction.delete({ where: { id: cashTransaction.id } })
    await prisma.technicianPayment.delete({ where: { id: payment.id } })
    console.log('✅ Test data cleaned up')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
