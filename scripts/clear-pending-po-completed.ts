import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script untuk clear pending PO dan (opsional) membuat PO backdate.
 *
 * Mode:
 * - CHECK:  Hanya cek, tidak mengubah apapun
 * - SIMPLE: Clear status saja (laporan laba-rugi tetap balance)
 * - FULL:   Buat PO backdate (laporan pembelian juga lengkap)
 *
 * Jalankan dengan:
 *   npx tsx scripts/clear-pending-po-completed.ts [CHECK|SIMPLE|FULL]
 *
 * Default: CHECK
 */

const mode = (process.argv[2]?.toUpperCase() || 'CHECK') as 'CHECK' | 'SIMPLE' | 'FULL'

async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔧 MODE: ${mode}`)
  console.log(`${'='.repeat(60)}\n`)

  // Find all items with PENDING PO status on completed projects
  const pendingItems = await prisma.projectItem.findMany({
    where: {
      poStatus: 'PENDING',
      project: {
        status: {
          in: ['COMPLETED', 'PAID', 'CLOSED'],
        },
      },
    },
    include: {
      project: {
        select: {
          id: true,
          projectNumber: true,
          status: true,
          createdAt: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          purchasePrice: true,
        },
      },
    },
    orderBy: [{ project: { createdAt: 'asc' } }, { addedAt: 'asc' }],
  })

  if (pendingItems.length === 0) {
    console.log('✅ No pending PO items found on completed projects.\n')
    return
  }

  console.log(`📋 Found ${pendingItems.length} items with PENDING PO status:\n`)

  // Check for items with missing cost
  const itemsWithMissingCost = pendingItems.filter(
    i => Number(i.cost) === 0 && Number(i.totalCost) === 0
  )

  console.table(
    pendingItems.map(i => ({
      Project: i.project.projectNumber,
      Status: i.project.status,
      Item: i.name.substring(0, 25),
      Qty: i.quantity,
      Cost: Number(i.cost),
      TotalCost: Number(i.totalCost),
      HasProduct: i.product ? '✅' : '❌',
      'Cost OK?': Number(i.totalCost) > 0 ? '✅' : '⚠️',
    }))
  )

  if (mode === 'CHECK') {
    console.log('\n📊 SUMMARY (CHECK MODE - No changes made)')
    console.log(`   Total items: ${pendingItems.length}`)
    console.log(`   Items with missing cost: ${itemsWithMissingCost.length}`)
    console.log(`   Items with product: ${pendingItems.filter(i => i.product).length}`)
    console.log('\n💡 Run with SIMPLE to just clear status')
    console.log('💡 Run with FULL to create backdated PO\n')
    return
  }

  if (mode === 'SIMPLE') {
    // Simple mode: just clear status and fill costs
    console.log('\n🔧 SIMPLE MODE: Clearing status and filling missing costs...\n')

    // Fix missing costs first
    if (itemsWithMissingCost.length > 0) {
      console.log(`⚠️  Filling ${itemsWithMissingCost.length} items with missing cost...\n`)

      for (const item of itemsWithMissingCost) {
        if (item.product?.purchasePrice) {
          const cost = Number(item.product.purchasePrice)
          const totalCost = cost * item.quantity

          await prisma.projectItem.update({
            where: { id: item.id },
            data: { cost, totalCost },
          })
          console.log(`   ✅ ${item.name}: ${cost} × ${item.quantity} = ${totalCost}`)
        } else {
          console.log(`   ⚠️  ${item.name}: No product price, cost remains 0`)
        }
      }
    }

    // Update all pending items to NONE
    const updateResult = await prisma.projectItem.updateMany({
      where: {
        poStatus: 'PENDING',
        project: { status: { in: ['COMPLETED', 'PAID', 'CLOSED'] } },
      },
      data: { needsPo: false, poStatus: 'NONE' },
    })

    console.log(`\n✅ Updated ${updateResult.count} items (needsPo=false, poStatus=NONE)`)
    console.log('\n⚠️  NOTE: Laporan PEMBELIAN tidak akan menampilkan item ini')
    console.log('   karena tidak ada record PO. Gunakan mode FULL jika perlu.\n')
    return
  }

  if (mode === 'FULL') {
    console.log('\n🔧 FULL MODE: Creating backdated PO records...\n')

    // Check if we have a default supplier
    let defaultSupplier = await prisma.supplier.findFirst({
      where: { name: { contains: 'Default', mode: 'insensitive' } },
    })

    if (!defaultSupplier) {
      // Create default supplier for historical data
      defaultSupplier = await prisma.supplier.create({
        data: {
          name: 'Supplier Historis (Data Manual)',
          phone: '-',
          email: null,
          address: 'Digunakan untuk data historis sebelum sistem PO',
        },
      })
      console.log(`📦 Created default supplier: ${defaultSupplier.name}\n`)
    }

    // Group items by project
    const projectGroups = pendingItems.reduce(
      (acc, item) => {
        const key = item.project.id
        if (!acc[key]) {
          acc[key] = {
            project: item.project,
            items: [],
          }
        }
        acc[key].items.push(item)
        return acc
      },
      {} as Record<
        string,
        { project: (typeof pendingItems)[0]['project']; items: typeof pendingItems }
      >
    )

    let totalPOCreated = 0
    let totalItemsProcessed = 0

    for (const [projectId, group] of Object.entries(projectGroups)) {
      const { project, items } = group

      // Use project completion date or created date for backdating
      const poDate = project.createdAt
      const yearMonth = poDate.toISOString().slice(0, 7).replace('-', '')

      // Generate PO number
      const existingPOCount = await prisma.purchaseOrder.count({
        where: {
          poNumber: { startsWith: `PO-${yearMonth}` },
        },
      })
      const poNumber = `PO-${yearMonth}-${String(existingPOCount + 1).padStart(3, '0')}`

      // Fill missing costs
      for (const item of items) {
        if (Number(item.cost) === 0 && item.product?.purchasePrice) {
          const cost = Number(item.product.purchasePrice)
          await prisma.projectItem.update({
            where: { id: item.id },
            data: { cost, totalCost: cost * item.quantity },
          })
          item.cost = cost as any
          item.totalCost = (cost * item.quantity) as any
        }
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + Number(item.totalCost), 0)

      // Create the PO
      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          projectId: project.id,
          supplierId: defaultSupplier.id,
          subtotal,
          shippingCost: 0,
          otherCosts: 0,
          totalAmount: subtotal,
          status: 'RECEIVED',
          receivedDate: poDate,
          notes: `PO historis - dibuat otomatis dari script untuk proyek ${project.projectNumber}`,
          createdAt: poDate,
          items: {
            create: items.map(item => ({
              projectItemId: item.id,
              productId: item.product?.id || null,
              name: item.name,
              quantity: item.quantity,
              price: Number(item.cost) || 0,
              total: Number(item.totalCost) || 0,
              receivedQty: item.quantity,
            })),
          },
        },
      })

      // Update project items
      await prisma.projectItem.updateMany({
        where: { id: { in: items.map(i => i.id) } },
        data: { needsPo: false, poStatus: 'RECEIVED' },
      })

      console.log(
        `   ✅ ${project.projectNumber}: Created ${poNumber} with ${items.length} items (Rp ${subtotal.toLocaleString()})`
      )
      totalPOCreated++
      totalItemsProcessed += items.length
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('📊 SUMMARY')
    console.log(`${'='.repeat(60)}`)
    console.log(`   PO created: ${totalPOCreated}`)
    console.log(`   Items processed: ${totalItemsProcessed}`)
    console.log(`   Default supplier: ${defaultSupplier.name}`)
    console.log('\n✅ Laporan PEMBELIAN sekarang akan menampilkan item ini.\n')
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
