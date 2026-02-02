import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkOtherIncome() {
  try {
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== CEK DETAIL PEMASUKAN "OTHER" 2025 ===\n')

    // Get all OTHER income
    const otherIncome = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        type: 'INCOME',
        category: 'OTHER',
      },
      orderBy: { date: 'asc' },
    })

    console.log(`Total Transaksi: ${otherIncome.length}\n`)

    let totalSisaUpah = 0
    let totalOther = 0

    otherIncome.forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.date.toLocaleDateString('id-ID')}`)
      console.log(`   Deskripsi: ${tx.description}`)
      console.log(`   Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
      console.log(`   Reference: ${tx.referenceId || '-'}`)

      // Check if it's related to technician payment
      if (
        tx.description.toLowerCase().includes('sisa') &&
        (tx.description.toLowerCase().includes('upah') ||
          tx.description.toLowerCase().includes('teknisi') ||
          tx.description.toLowerCase().includes('fee'))
      ) {
        console.log(`   ⚠️ INI SISA UPAH TEKNISI!`)
        totalSisaUpah += Number(tx.amount)
      } else {
        totalOther += Number(tx.amount)
      }
      console.log()
    })

    const total = otherIncome.reduce((sum, tx) => sum + Number(tx.amount), 0)

    console.log('═══════════════════════════════════════')
    console.log(`Total Sisa Upah Teknisi: Rp ${totalSisaUpah.toLocaleString('id-ID')}`)
    console.log(`Total Other (bukan sisa upah): Rp ${totalOther.toLocaleString('id-ID')}`)
    console.log(`TOTAL PEMASUKAN OTHER: Rp ${total.toLocaleString('id-ID')}`)
    console.log('═══════════════════════════════════════\n')

    // Now let's check technician payments
    console.log('\n=== CEK PEMBAYARAN TEKNISI 2025 ===\n')

    const techPayments = await prisma.technicianPayment.findMany({
      where: {
        paidDate: { gte: startDate, lte: endDate },
        status: 'PAID',
      },
      include: {
        technician: true,
        project: true,
      },
      orderBy: { paidDate: 'asc' },
    })

    console.log(`Total Pembayaran Teknisi: ${techPayments.length}\n`)

    let totalPaid = 0
    techPayments.forEach((payment, idx) => {
      console.log(
        `${idx + 1}. ${payment.paidDate?.toLocaleDateString('id-ID')} - ${payment.paymentNumber}`
      )
      console.log(`   Teknisi: ${payment.technician.name}`)
      console.log(`   Project: ${payment.project?.projectNumber || '-'}`)
      console.log(`   Amount: Rp ${Number(payment.amount).toLocaleString('id-ID')}`)
      console.log(`   Description: ${payment.description || '-'}`)
      totalPaid += Number(payment.amount)
      console.log()
    })

    console.log(`TOTAL DIBAYAR KE TEKNISI: Rp ${totalPaid.toLocaleString('id-ID')}\n`)

    // Check if there's double counting
    if (totalSisaUpah > 0) {
      console.log('\n⚠️⚠️⚠️ POTENSI DOUBLE COUNTING DITEMUKAN! ⚠️⚠️⚠️\n')
      console.log('Sisa upah teknisi dicatat sebagai INCOME di cashflow.')
      console.log('Padahal seharusnya:')
      console.log('1. Sisa upah = PENGURANGAN dari biaya gaji teknisi')
      console.log('2. BUKAN income (pemasukan)')
      console.log('')
      console.log('Dampak ke Laba Rugi:')
      console.log(`- Laba Rugi mungkin sudah mengurangi biaya teknisi`)
      console.log(`- Tapi di Cashflow dicatat sebagai income lagi`)
      console.log(
        `- Ini membuat cashflow jadi lebih tinggi Rp ${totalSisaUpah.toLocaleString('id-ID')}`
      )
      console.log('')
      console.log('Solusi:')
      console.log('1. Hapus entry "OTHER" income untuk sisa upah teknisi')
      console.log(
        '2. ATAU ubah menjadi EXPENSE negatif (pengurangan biaya) bukan INCOME di cashflow'
      )
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOtherIncome()
