import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Memeriksa transaksi SALARY di Januari 2026...\n')

  const janSalary = await prisma.cashTransaction.findMany({
    where: {
      type: 'EXPENSE',
      category: 'SALARY',
      date: {
        gte: new Date('2026-01-01'),
        lt: new Date('2026-02-01'),
      },
    },
    orderBy: { date: 'asc' },
  })

  console.log('='.repeat(100))
  console.log('Transaksi Gaji di Januari 2026:')
  console.log('='.repeat(100))

  const issues: any[] = []

  for (const tx of janSalary) {
    // Cek jika punya referenceId ke TechnicianPayment
    let paymentInfo: any = null
    if (tx.referenceId && tx.referenceType === 'TechnicianPayment') {
      paymentInfo = await prisma.technicianPayment.findUnique({
        where: { id: tx.referenceId },
        include: { technician: true },
      })
    }

    console.log('\n---')
    console.log('ID:', tx.id)
    console.log('Reference:', tx.reference)
    console.log('Description:', tx.description)
    console.log('Amount: Rp', Number(tx.amount).toLocaleString('id-ID'))
    console.log('Tanggal Cashflow:', tx.date.toLocaleDateString('id-ID'))

    if (paymentInfo) {
      console.log('--- Payment Info ---')
      console.log('Payment Number:', paymentInfo.paymentNumber)
      console.log('Paid Date:', paymentInfo.paidDate?.toLocaleDateString('id-ID') || 'NULL')
      console.log('Created At:', paymentInfo.createdAt.toLocaleDateString('id-ID'))

      const correctDate = paymentInfo.paidDate || paymentInfo.createdAt
      const cashDate = tx.date

      if (correctDate.toISOString().split('T')[0] !== cashDate.toISOString().split('T')[0]) {
        console.log('⚠️  MISMATCH! Seharusnya:', correctDate.toLocaleDateString('id-ID'))
        issues.push({
          cashId: tx.id,
          reference: tx.reference,
          paymentNumber: paymentInfo.paymentNumber,
          technicianName: paymentInfo.technician?.name,
          amount: Number(tx.amount),
          cashDate: tx.date,
          correctDate: correctDate,
        })
      } else {
        console.log('✅ Tanggal sudah sesuai')
      }
    } else {
      console.log('⚠️  Tidak ada referensi ke TechnicianPayment')
    }
  }

  console.log('\n' + '='.repeat(100))
  console.log('\n📊 RINGKASAN:')
  console.log('Total transaksi gaji di Januari 2026:', janSalary.length)
  console.log(
    'Total nilai: Rp',
    janSalary.reduce((sum, tx) => sum + Number(tx.amount), 0).toLocaleString('id-ID')
  )

  if (issues.length > 0) {
    console.log('\n⚠️  DITEMUKAN', issues.length, 'TRANSAKSI DENGAN TANGGAL TIDAK SESUAI:')
    console.log('='.repeat(100))
    for (const issue of issues) {
      console.log(`\n${issue.paymentNumber} - ${issue.technicianName}`)
      console.log(`  Amount: Rp ${issue.amount.toLocaleString('id-ID')}`)
      console.log(`  Tanggal Cashflow (SALAH): ${issue.cashDate.toLocaleDateString('id-ID')}`)
      console.log(`  Tanggal Seharusnya: ${issue.correctDate.toLocaleDateString('id-ID')}`)
    }
  } else {
    console.log('\n✅ Semua tanggal sudah sesuai!')
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
})
