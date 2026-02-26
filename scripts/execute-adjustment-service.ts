import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function adjustmentServiceBudget() {
  try {
    console.log('💰 Adjustment HPP Service yang tidak terpakai...\n')

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
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    const totalServiceCost = serviceItems.reduce((sum, i) => sum + Number(i.totalCost), 0)

    console.log(`📊 Total HPP Service: Rp ${totalServiceCost.toLocaleString('id-ID')}`)
    console.log(`📋 Total items: ${serviceItems.length}\n`)

    console.log('📝 Detail items yang akan di-adjust:\n')
    const grouped = serviceItems.reduce(
      (acc, item) => {
        const name = item.product.name
        if (!acc[name]) acc[name] = { count: 0, total: 0 }
        acc[name].count += 1
        acc[name].total += Number(item.totalCost)
        return acc
      },
      {} as Record<string, { count: number; total: number }>
    )

    Object.entries(grouped).forEach(([name, data]) => {
      console.log(`- ${name}: ${data.count}x = Rp ${data.total.toLocaleString('id-ID')}`)
    })

    console.log('\n⚠️  KONFIRMASI:')
    console.log(
      'Dana sebesar Rp ' +
        totalServiceCost.toLocaleString('id-ID') +
        ' akan dicatat sebagai INCOME (efisiensi/laba tambahan)'
    )
    console.log('karena biaya habis pakai ini tidak benar-benar keluar kas.\n')

    // EXECUTE: Catat adjustment sebagai income
    const cashTransaction = await prisma.cashTransaction.create({
      data: {
        type: 'INCOME',
        category: 'OTHER',
        description: 'Adjustment HPP Service - Efisiensi biaya habis pakai & maintenance',
        amount: totalServiceCost,
        date: new Date(),
        referenceType: 'NOTE',
        referenceId: 'HPP-SERVICE-ADJUSTMENT-2026',
      },
    })

    console.log('✅ BERHASIL!')
    console.log(`   Transaction ID: ${cashTransaction.id}`)
    console.log(`   Type: ${cashTransaction.type}`)
    console.log(`   Category: ${cashTransaction.category}`)
    console.log(`   Amount: Rp ${Number(cashTransaction.amount).toLocaleString('id-ID')}`)
    console.log(`   Date: ${cashTransaction.date.toLocaleDateString('id-ID')}`)

    console.log('\n📈 DAMPAK:')
    console.log(
      '   - Cashflow balance akan bertambah Rp ' + totalServiceCost.toLocaleString('id-ID')
    )
    console.log('   - Selisih di laporan Kas vs Akrual akan hilang/berkurang untuk HPP Service')
    console.log('   - Ini dihitung sebagai efisiensi perusahaan')

    console.log('\n💡 CATATAN:')
    console.log('   Jika ternyata nanti ada pembelian habis pakai, catat sebagai expense biasa.')
    console.log('   Adjustment ini bisa di-reverse jika diperlukan.')

    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

adjustmentServiceBudget()
