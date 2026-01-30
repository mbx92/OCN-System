import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fix Tanggal Cashflow Gaji Januari 2026 (Backdate)\n')

  // Cari transaksi yang perlu diperbaiki
  const issues = [
    {
      reference: 'PAY-202601-030',
      cashId: 'cmkqx9ehu000rrnf1wpgaga20',
    },
    {
      reference: 'PAY-202601-029',
      cashId: 'cmkqx9gr8000urnf1es40kmdl',
    },
    {
      reference: 'PAY-202601-040',
      cashId: 'cmkrvey5f003xmecifeb4vly4',
    },
  ]

  console.log('Transaksi yang akan diperbaiki:')
  console.log('='.repeat(80))

  const updates: any[] = []

  for (const issue of issues) {
    const cashTx = await prisma.cashTransaction.findUnique({
      where: { id: issue.cashId },
    })

    if (!cashTx || !cashTx.referenceId) continue

    const payment = await prisma.technicianPayment.findUnique({
      where: { id: cashTx.referenceId },
      include: { technician: true },
    })

    if (!payment) continue

    const correctDate = payment.paidDate || payment.createdAt

    console.log(`\n${payment.paymentNumber} - ${payment.technician?.name}`)
    console.log(`  Amount: Rp ${Number(cashTx.amount).toLocaleString('id-ID')}`)
    console.log(`  Tanggal Cashflow Saat Ini: ${cashTx.date.toLocaleDateString('id-ID')}`)
    console.log(`  Akan Diubah Ke: ${correctDate.toLocaleDateString('id-ID')}`)

    updates.push({
      cashId: cashTx.id,
      paymentNumber: payment.paymentNumber,
      technicianName: payment.technician?.name,
      oldDate: cashTx.date,
      newDate: correctDate,
    })
  }

  console.log('\n' + '='.repeat(80))

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
    await prisma.$disconnect()
    return
  }

  // Update data
  console.log('\n🔄 Memulai update...\n')
  let updated = 0

  for (const update of updates) {
    await prisma.cashTransaction.update({
      where: { id: update.cashId },
      data: {
        date: update.newDate,
      },
    })
    console.log(
      `✅ Updated: ${update.paymentNumber} - ${update.oldDate.toLocaleDateString('id-ID')} → ${update.newDate.toLocaleDateString('id-ID')}`
    )
    updated++
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✨ Selesai! ${updated} transaksi berhasil diupdate`)
  console.log('\nTransaksi berikut sudah dipindah ke bulan yang benar:')
  console.log('- PAY-202601-030 & PAY-202601-029: September 2025')
  console.log('- PAY-202601-040: Agustus 2025')

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})
