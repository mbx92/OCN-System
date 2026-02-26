import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPOStatus2025() {
  try {
    const year = 2025
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

    console.log('=== CEK STATUS PURCHASE ORDER 2025 ===\n')

    // Get all POs
    const allPOs = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        supplier: true,
        project: { select: { projectNumber: true, title: true } },
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`Total Purchase Orders: ${allPOs.length}\n`)

    // Group by status
    const byStatus: { [key: string]: typeof allPOs } = {}
    allPOs.forEach(po => {
      if (!byStatus[po.status]) byStatus[po.status] = []
      byStatus[po.status].push(po)
    })

    Object.entries(byStatus).forEach(([status, pos]) => {
      const total = pos.reduce((sum, po) => sum + Number(po.totalAmount), 0)
      console.log(`${status}: ${pos.length} PO (Total: Rp ${total.toLocaleString('id-ID')})`)
    })

    console.log('\n' + '='.repeat(80) + '\n')

    // Detail each PO
    allPOs.forEach((po, idx) => {
      console.log(`${idx + 1}. ${po.poNumber} - ${po.status}`)
      console.log(`   Supplier: ${po.supplier.name}`)
      console.log(`   Project: ${po.project?.projectNumber || 'Direct PO (no project)'}`)
      console.log(`   Total: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
      console.log(`   Created: ${po.createdAt.toLocaleDateString('id-ID')}`)
      if (po.receivedDate) {
        console.log(`   Received: ${po.receivedDate.toLocaleDateString('id-ID')}`)
      }
      console.log(`   Items: ${po.items.length} item(s)`)
      console.log()
    })

    // Check if PO expenses recorded in cashflow
    console.log('=== CEK CASHFLOW PO ===\n')

    const poCashTx = await prisma.cashTransaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        category: 'PO',
        type: 'EXPENSE',
      },
      orderBy: { date: 'asc' },
    })

    console.log(`Total Cash Transaction kategori PO: ${poCashTx.length}`)
    const totalPOCash = poCashTx.reduce((sum, tx) => sum + Number(tx.amount), 0)
    console.log(`Total: Rp ${totalPOCash.toLocaleString('id-ID')}\n`)

    if (poCashTx.length > 0) {
      poCashTx.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.date.toLocaleDateString('id-ID')}`)
        console.log(`   ${tx.description}`)
        console.log(`   Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
        console.log(`   Ref: ${tx.reference}`)
        console.log()
      })
    }

    // Compare
    const receivedPOs = allPOs.filter(po => po.status === 'RECEIVED')
    const totalReceivedPO = receivedPOs.reduce((sum, po) => sum + Number(po.totalAmount), 0)

    console.log('\n' + '='.repeat(80))
    console.log('SUMMARY:')
    console.log('='.repeat(80))
    console.log(`Total PO RECEIVED: ${receivedPOs.length} PO`)
    console.log(`Total Amount PO RECEIVED: Rp ${totalReceivedPO.toLocaleString('id-ID')}`)
    console.log(`Total Cashflow PO: Rp ${totalPOCash.toLocaleString('id-ID')}`)
    console.log(`Selisih: Rp ${(totalReceivedPO - totalPOCash).toLocaleString('id-ID')}`)
    console.log('='.repeat(80) + '\n')

    if (totalReceivedPO !== totalPOCash) {
      console.log('⚠️ ADA KETIDAKSESUAIAN!\n')
      console.log('PO yang sudah RECEIVED tapi belum tercatat di Cashflow:')

      for (const po of receivedPOs) {
        const hasCashTx = poCashTx.some(tx => tx.referenceId === po.id)
        if (!hasCashTx) {
          console.log(`- ${po.poNumber}: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
        }
      }
    } else if (totalReceivedPO === 0 && poCashTx.length === 0) {
      console.log('💡 TIDAK ADA PO yang RECEIVED di 2025')
      console.log('   Ini menjelaskan kenapa HPP tidak keluar dari kas!\n')

      const draftPOs = allPOs.filter(po => po.status === 'DRAFT')
      const progressPOs = allPOs.filter(po => po.status === 'PROGRESS')

      if (draftPOs.length > 0) {
        console.log(`   ${draftPOs.length} PO masih DRAFT (belum dikirim)`)
      }
      if (progressPOs.length > 0) {
        console.log(`   ${progressPOs.length} PO masih PROGRESS (sudah dikirim, belum diterima)`)
      }
    } else {
      console.log('✅ Semua PO RECEIVED sudah tercatat di Cashflow')
    }

    // Check projects with items that should have PO
    console.log('\n\n=== CEK PROJECT ITEMS YANG SEHARUSNYA PUNYA PO ===\n')

    const projectsIn2025 = await prisma.project.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
        ],
        status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    console.log(`Total Projects di 2025: ${projectsIn2025.length}\n`)

    let totalItemsCost = 0
    let totalItemsWithPO = 0
    let totalItemsNoPO = 0

    projectsIn2025.forEach(project => {
      project.items.forEach(item => {
        const cost = Number(item.totalCost || 0)
        totalItemsCost += cost

        if (item.needsPo) {
          totalItemsWithPO += cost
        } else {
          totalItemsNoPO += cost
        }
      })
    })

    console.log(`Total HPP (Items Cost): Rp ${totalItemsCost.toLocaleString('id-ID')}`)
    console.log(`- Items dengan PO: Rp ${totalItemsWithPO.toLocaleString('id-ID')}`)
    console.log(`- Items tanpa PO (stok): Rp ${totalItemsNoPO.toLocaleString('id-ID')}\n`)

    console.log('💡 PENJELASAN:')
    console.log('━'.repeat(80))
    console.log('HPP tidak keluar dari kas karena:')
    console.log('1. Barang dibeli dengan PO, tapi PO belum di-receive')
    console.log('2. ATAU barang pakai dari stok yang sudah ada (dibeli sebelum 2025)')
    console.log('3. Saat PO di-RECEIVE, baru akan tercatat pengeluaran di cashflow')
    console.log('━'.repeat(80) + '\n')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPOStatus2025()
