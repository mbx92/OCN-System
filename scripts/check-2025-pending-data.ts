// Script to check pending POs and technician payments for 2025 projects
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check2025PendingData() {
  console.log('🔍 ANALISIS DATA PENDING TAHUN 2025\n')
  console.log('='.repeat(80))

  const year = 2025
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999)

  // 1. CHECK PENDING POs
  console.log('\n📦 1. CEK PO YANG MASIH PENDING\n')

  const pendingPOs = await prisma.purchaseOrder.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ['DRAFT', 'ORDERED'] },
    },
    include: {
      project: true,
      supplier: true,
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Ditemukan ${pendingPOs.length} PO yang belum RECEIVED\n`)

  if (pendingPOs.length > 0) {
    pendingPOs.forEach((po, idx) => {
      console.log(`${idx + 1}. ${po.poNumber} - ${po.status}`)
      console.log(`   Project: ${po.project?.projectNumber || 'N/A'} - ${po.project?.title || ''}`)
      console.log(`   Supplier: ${po.supplier.name}`)
      console.log(`   Total: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
      console.log(`   Items: ${po.items.length}`)
      console.log(`   Tanggal: ${po.createdAt.toLocaleDateString('id-ID')}`)
      console.log()
    })

    console.log(
      `💡 Total nilai PO pending: Rp ${pendingPOs.reduce((sum, po) => sum + Number(po.totalAmount), 0).toLocaleString('id-ID')}`
    )
  } else {
    console.log('✅ Tidak ada PO pending')
  }

  // 2. CHECK PROJECT ITEMS YANG BUTUH PO TAPI BELUM ADA
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 2. CEK PROJECT ITEMS YANG BUTUH PO TAPI BELUM ADA\n')

  const itemsNeedingPO = await prisma.projectItem.findMany({
    where: {
      project: {
        createdAt: { gte: startDate, lte: endDate },
      },
      needsPo: true,
      poStatus: { in: ['PENDING', 'PARTIAL'] },
    },
    include: {
      project: true,
      product: true,
    },
    orderBy: { project: { projectNumber: 'asc' } },
  })

  console.log(`Ditemukan ${itemsNeedingPO.length} item yang membutuhkan PO\n`)

  if (itemsNeedingPO.length > 0) {
    const groupedByProject = itemsNeedingPO.reduce(
      (acc, item) => {
        const projectId = item.project.id
        if (!acc[projectId]) {
          acc[projectId] = {
            project: item.project,
            items: [],
          }
        }
        acc[projectId].items.push(item)
        return acc
      },
      {} as Record<string, { project: any; items: any[] }>
    )

    Object.values(groupedByProject).forEach((group, idx) => {
      console.log(`${idx + 1}. ${group.project.projectNumber} - ${group.project.title}`)
      console.log(`   Status: ${group.project.status}`)
      console.log(`   Items yang perlu PO: ${group.items.length}`)
      group.items.forEach(item => {
        console.log(`   - ${item.name}: ${item.quantity} ${item.unit} (${item.poStatus})`)
      })
      console.log()
    })
  } else {
    console.log('✅ Semua item yang butuh PO sudah memiliki PO')
  }

  // 3. CHECK TECHNICIAN PAYMENTS YANG BELUM DIBAYAR
  console.log('\n' + '='.repeat(80))
  console.log('\n👷 3. CEK PEMBAYARAN TEKNISI YANG BELUM LUNAS\n')

  const unpaidTechPayments = await prisma.technicianPayment.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: 'PENDING',
    },
    include: {
      technician: true,
      project: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Ditemukan ${unpaidTechPayments.length} pembayaran teknisi yang masih PENDING\n`)

  if (unpaidTechPayments.length > 0) {
    unpaidTechPayments.forEach((payment, idx) => {
      console.log(`${idx + 1}. ${payment.paymentNumber}`)
      console.log(`   Teknisi: ${payment.technician.name}`)
      console.log(
        `   Project: ${payment.project?.projectNumber || 'N/A'} - ${payment.project?.title || ''}`
      )
      console.log(`   Jumlah: Rp ${Number(payment.amount).toLocaleString('id-ID')}`)
      console.log(`   Periode: ${payment.period}`)
      console.log(`   Status: ${payment.status}`)
      console.log()
    })

    console.log(
      `💡 Total pembayaran pending: Rp ${unpaidTechPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('id-ID')}`
    )
  } else {
    console.log('✅ Tidak ada pembayaran teknisi yang pending')
  }

  // 4. CHECK PROJECT TECHNICIANS YANG BELUM PUNYA PAYMENT RECORD
  console.log('\n' + '='.repeat(80))
  console.log('\n🔍 4. CEK TEKNISI PROJECT YANG BELUM ADA PAYMENT RECORD\n')

  const projects2025 = await prisma.project.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ['COMPLETED', 'PAID', 'CLOSED'] },
    },
    include: {
      technicians: {
        include: {
          technician: true,
        },
      },
    },
    orderBy: { projectNumber: 'asc' },
  })

  console.log(`Total project selesai di 2025: ${projects2025.length}\n`)

  const techWithoutPayment: any[] = []

  for (const project of projects2025) {
    for (const projTech of project.technicians) {
      // Check if there's a payment record
      const payment = await prisma.technicianPayment.findFirst({
        where: {
          technicianId: projTech.technicianId,
          projectId: project.id,
        },
      })

      if (!payment) {
        techWithoutPayment.push({
          project: project,
          technician: projTech,
        })
      }
    }
  }

  console.log(
    `Ditemukan ${techWithoutPayment.length} assignment teknisi yang belum punya payment record\n`
  )

  if (techWithoutPayment.length > 0) {
    const groupedByProject = techWithoutPayment.reduce(
      (acc, item) => {
        const projectNumber = item.project.projectNumber
        if (!acc[projectNumber]) {
          acc[projectNumber] = {
            project: item.project,
            technicians: [],
          }
        }
        acc[projectNumber].technicians.push(item.technician)
        return acc
      },
      {} as Record<string, { project: any; technicians: any[] }>
    )

    Object.values(groupedByProject).forEach((group, idx) => {
      console.log(`${idx + 1}. ${group.project.projectNumber} - ${group.project.title}`)
      console.log(`   Status: ${group.project.status}`)
      console.log(`   Budget: Rp ${Number(group.project.budget || 0).toLocaleString('id-ID')}`)
      console.log(`   Teknisi yang belum ada payment:`)
      group.technicians.forEach(tech => {
        const feeAmount =
          tech.feeType === 'PERCENTAGE'
            ? `${tech.fee}% (estimasi)`
            : tech.feeType === 'FIXED'
              ? `Rp ${Number(tech.fee || 0).toLocaleString('id-ID')}`
              : 'Belum diset'
        console.log(`   - ${tech.technician.name} (${tech.technician.type}) - Fee: ${feeAmount}`)
        console.log(
          `     Paid: ${tech.isPaid ? 'Ya' : 'Tidak'}, Paid Date: ${tech.paidDate ? tech.paidDate.toLocaleDateString('id-ID') : '-'}`
        )
      })
      console.log()
    })
  } else {
    console.log('✅ Semua teknisi sudah memiliki payment record')
  }

  // 5. CHECK PROJECT TECHNICIANS YANG SUDAH isPaid TAPI BELUM ADA DI TechnicianPayment
  console.log('\n' + '='.repeat(80))
  console.log('\n⚠️  5. CEK TEKNISI YANG isPaid=true TAPI TIDAK ADA DI TechnicianPayment\n')

  const paidTechsWithoutRecord: any[] = []

  for (const project of projects2025) {
    for (const projTech of project.technicians) {
      if (projTech.isPaid) {
        // Check if there's a payment record with PAID status
        const payment = await prisma.technicianPayment.findFirst({
          where: {
            technicianId: projTech.technicianId,
            projectId: project.id,
            status: 'PAID',
          },
        })

        if (!payment) {
          paidTechsWithoutRecord.push({
            project: project,
            technician: projTech,
          })
        }
      }
    }
  }

  console.log(
    `Ditemukan ${paidTechsWithoutRecord.length} teknisi dengan isPaid=true tapi tidak ada payment record PAID\n`
  )

  if (paidTechsWithoutRecord.length > 0) {
    paidTechsWithoutRecord.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.project.projectNumber} - ${item.technician.technician.name}`)
      console.log(`   Project: ${item.project.title}`)
      console.log(`   Fee Type: ${item.technician.feeType}`)
      console.log(`   Fee: ${item.technician.fee}`)
      console.log(`   Paid Date: ${item.technician.paidDate?.toLocaleDateString('id-ID') || '-'}`)
      console.log()
    })

    console.log('💡 Teknisi ini perlu dibuatkan TechnicianPayment record dengan status PAID')
  } else {
    console.log('✅ Semua teknisi dengan isPaid=true sudah memiliki payment record')
  }

  // SUMMARY
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RINGKASAN\n')
  console.log(`1. PO Pending: ${pendingPOs.length}`)
  console.log(`2. Project Items butuh PO: ${itemsNeedingPO.length}`)
  console.log(`3. Pembayaran Teknisi PENDING: ${unpaidTechPayments.length}`)
  console.log(`4. Teknisi tanpa payment record: ${techWithoutPayment.length}`)
  console.log(`5. Teknisi isPaid=true tanpa payment PAID: ${paidTechsWithoutRecord.length}`)
  console.log()

  if (
    pendingPOs.length === 0 &&
    itemsNeedingPO.length === 0 &&
    unpaidTechPayments.length === 0 &&
    techWithoutPayment.length === 0 &&
    paidTechsWithoutRecord.length === 0
  ) {
    console.log('✅ SEMUA DATA SUDAH LENGKAP DAN BALANCE!')
  } else {
    console.log('⚠️  MASIH ADA DATA YANG PERLU DISELESAIKAN')
    console.log('\n💡 SARAN TINDAKAN:')

    if (pendingPOs.length > 0) {
      console.log('   1. Update status PO yang sudah diterima ke RECEIVED')
    }

    if (itemsNeedingPO.length > 0) {
      console.log('   2. Buat PO untuk item yang masih pending')
    }

    if (unpaidTechPayments.length > 0) {
      console.log('   3. Update status pembayaran teknisi yang sudah dibayar ke PAID')
    }

    if (techWithoutPayment.length > 0) {
      console.log('   4. Buat payment record untuk teknisi yang belum punya record')
    }

    if (paidTechsWithoutRecord.length > 0) {
      console.log('   5. Buat payment record PAID untuk teknisi yang sudah isPaid=true')
    }
  }

  console.log('\n' + '='.repeat(80))
}

check2025PendingData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
