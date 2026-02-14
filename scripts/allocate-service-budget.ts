import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function allocateServiceBudget() {
  try {
    console.log('💰 Mengalokasikan dana HPP Service/Habis Pakai...\n')

    // Total HPP Service dari items tanpa PO
    const serviceItems = await prisma.projectItem.findMany({
      where: {
        totalCost: { gt: 0 },
        poStatus: { in: ['NONE', 'PENDING'] },
        product: {
          isService: true,
        },
      },
      include: {
        project: {
          select: {
            projectNumber: true,
            createdAt: true,
          },
        },
      },
    })

    const totalServiceCost = serviceItems.reduce((sum, i) => sum + Number(i.totalCost), 0)

    console.log(
      `Total HPP Service yang perlu dialokasikan: Rp ${totalServiceCost.toLocaleString('id-ID')}`
    )
    console.log(`Total items: ${serviceItems.length}\n`)

    console.log('⚠️  PILIHAN:')
    console.log('1. Opsi A: Dana sudah digunakan (catat sebagai expense habis pakai)')
    console.log('2. Opsi B: Dana disisihkan untuk cadangan (catat sebagai alokasi dana)')
    console.log('3. Opsi C: Dana tidak terpakai (adjustment sebagai laba tambahan)')
    console.log('\n📌 Untuk menjalankan:')
    console.log('   Edit script ini dan uncomment salah satu opsi di bawah:\n')

    // OPSI A: Dana sudah digunakan untuk habis pakai
    // const cashTransaction = await prisma.cashTransaction.create({
    //   data: {
    //     type: 'EXPENSE',
    //     category: 'PROJECT_MATERIAL',
    //     description: 'Pembelian habis pakai (klem, ties, kabel, dll) - backdate record',
    //     amount: totalServiceCost,
    //     date: new Date(), // Ganti dengan tanggal pembelian sebenarnya
    //     referenceType: 'NOTE',
    //     referenceId: 'HPP-SERVICE-ALLOCATION',
    //   },
    // })
    // console.log('✅ Berhasil catat pengeluaran habis pakai:', cashTransaction.id)

    // OPSI B: Dana disisihkan sebagai cadangan
    // const cashTransaction = await prisma.cashTransaction.create({
    //   data: {
    //     type: 'EXPENSE',
    //     category: 'OPERATIONAL',
    //     description: 'Alokasi dana cadangan habis pakai & maintenance',
    //     amount: totalServiceCost,
    //     date: new Date(),
    //     referenceType: 'NOTE',
    //     referenceId: 'HPP-SERVICE-RESERVE',
    //   },
    // })
    // console.log('✅ Berhasil alokasi dana cadangan:', cashTransaction.id)

    // OPSI C: Dana tidak terpakai (adjustment sebagai income)
    // const cashTransaction = await prisma.cashTransaction.create({
    //   data: {
    //     type: 'INCOME',
    //     category: 'OTHER',
    //     description: 'Adjustment HPP Service tidak terpakai (efisiensi)',
    //     amount: totalServiceCost,
    //     date: new Date(),
    //     referenceType: 'NOTE',
    //     referenceId: 'HPP-SERVICE-ADJUSTMENT',
    //   },
    // })
    // console.log('✅ Berhasil catat adjustment income:', cashTransaction.id)

    console.log('\n💡 Setelah dicatat, selisih di laporan Kas vs Akrual akan berkurang/hilang')

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

allocateServiceBudget()
