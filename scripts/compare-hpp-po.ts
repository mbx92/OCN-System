import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script untuk membandingkan HPP (item fisik) dengan total PO.
 *
 * Membantu verifikasi apakah pembelian sudah tercatat dengan benar.
 *
 * Jalankan dengan: npx tsx scripts/compare-hpp-po.ts [YYYY-MM]
 * Contoh: npx tsx scripts/compare-hpp-po.ts 2025-12
 */

const periodArg = process.argv[2] || new Date().toISOString().slice(0, 7) // Default: bulan ini

async function main() {
  const [yearStr, monthStr] = periodArg.split('-')
  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  console.log(`\n${'='.repeat(70)}`)
  console.log(`📊 PERBANDINGAN HPP vs PO - ${monthNames[month - 1]} ${year}`)
  console.log(`${'='.repeat(70)}\n`)

  // 1. Get all projects in period (completed/paid)
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
        { createdAt: { gte: startDate, lte: endDate } },
      ],
      status: { in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'] },
    },
    include: {
      items: {
        include: {
          product: {
            select: { isService: true, name: true },
          },
        },
      },
    },
  })

  // 2. Get all POs (received) in period
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      receivedDate: { gte: startDate, lte: endDate },
      status: 'RECEIVED',
    },
    include: {
      items: true,
      project: { select: { projectNumber: true } },
    },
  })

  // Calculate totals
  let hppFisik = 0 // HPP untuk barang fisik saja
  let hppJasa = 0 // HPP untuk jasa
  let hppTotal = 0

  const projectDetails: any[] = []

  projects.forEach(project => {
    let projectFisik = 0
    let projectJasa = 0

    project.items.forEach(item => {
      const cost = Number(item.totalCost) || 0
      hppTotal += cost

      // Check if item is service
      const isService =
        item.product?.isService === true ||
        item.name.toLowerCase().includes('jasa') ||
        item.name.toLowerCase().includes('service') ||
        item.name.toLowerCase().includes('instalasi') ||
        item.name.toLowerCase().includes('setting') ||
        item.name.toLowerCase().includes('konfigurasi')

      if (isService) {
        hppJasa += cost
        projectJasa += cost
      } else {
        hppFisik += cost
        projectFisik += cost
      }
    })

    if (projectFisik + projectJasa > 0) {
      projectDetails.push({
        Project: project.projectNumber,
        Status: project.status,
        'HPP Fisik': projectFisik,
        'HPP Jasa': projectJasa,
        'HPP Total': projectFisik + projectJasa,
      })
    }
  })

  // PO totals
  const poTotal = purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0)

  // Display project details
  if (projectDetails.length > 0) {
    console.log('📋 Detail per Project:')
    console.table(projectDetails)
  }

  // Display PO details
  if (purchaseOrders.length > 0) {
    console.log('\n📦 Detail PO:')
    console.table(
      purchaseOrders.map(po => ({
        'PO Number': po.poNumber,
        Project: po.project?.projectNumber || '-',
        Items: po.items.length,
        Total: Number(po.totalAmount),
      }))
    )
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('📊 RINGKASAN')
  console.log(`${'='.repeat(70)}`)
  console.log(`\n1️⃣  HPP (Laba-Rugi):`)
  console.log(`    - Barang Fisik  : Rp ${hppFisik.toLocaleString()}`)
  console.log(`    - Jasa/Service  : Rp ${hppJasa.toLocaleString()}`)
  console.log(`    - TOTAL HPP     : Rp ${hppTotal.toLocaleString()}`)

  console.log(`\n2️⃣  Pembelian (PO RECEIVED):`)
  console.log(`    - Total PO      : Rp ${poTotal.toLocaleString()}`)
  console.log(`    - Jumlah PO     : ${purchaseOrders.length}`)

  console.log(`\n3️⃣  Perbandingan HPP Fisik vs PO:`)
  const selisih = hppFisik - poTotal
  console.log(`    - HPP Fisik     : Rp ${hppFisik.toLocaleString()}`)
  console.log(`    - PO Total      : Rp ${poTotal.toLocaleString()}`)
  console.log(`    - Selisih       : Rp ${selisih.toLocaleString()}`)

  if (Math.abs(selisih) < 1) {
    console.log(`\n    ✅ MATCH! HPP Fisik = PO`)
  } else if (selisih > 0) {
    console.log(`\n    ⚠️  HPP Fisik > PO (ada item fisik yang belum ada PO-nya?)`)
  } else {
    console.log(`\n    ⚠️  PO > HPP Fisik (ada PO yang tidak masuk ke proyek?)`)
  }

  console.log(`\n4️⃣  Verifikasi Selisih Total:`)
  console.log(`    - HPP Total     : Rp ${hppTotal.toLocaleString()}`)
  console.log(`    - PO Total      : Rp ${poTotal.toLocaleString()}`)
  console.log(`    - Selisih       : Rp ${(hppTotal - poTotal).toLocaleString()}`)
  console.log(`    - HPP Jasa      : Rp ${hppJasa.toLocaleString()}`)

  const expectedDiff = hppJasa
  const actualDiff = hppTotal - poTotal
  if (Math.abs(expectedDiff - actualDiff) < 1) {
    console.log(`\n    ✅ COCOK! Selisih = HPP Jasa (benar)`)
  } else {
    console.log(`\n    ⚠️  Selisih tidak sama dengan HPP Jasa`)
    console.log(`       Expected selisih (jasa): Rp ${expectedDiff.toLocaleString()}`)
    console.log(`       Actual selisih: Rp ${actualDiff.toLocaleString()}`)
  }

  console.log('')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
