import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPOCashflowDates() {
  try {
    console.log('=== VERIFIKASI TANGGAL CASHFLOW PO ===\n')

    // Get all PO with cashflow
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        status: 'RECEIVED',
      },
      orderBy: { receivedDate: 'asc' },
    })

    console.log(`Total PO RECEIVED: ${pos.length}\n`)

    let correctDates = 0
    let wrongDates = 0
    const issues: any[] = []

    for (const po of pos) {
      const cashTx = await prisma.cashTransaction.findFirst({
        where: {
          referenceId: po.id,
          referenceType: 'PurchaseOrder',
        },
      })

      if (!cashTx) {
        console.log(`⚠️ ${po.poNumber} - TIDAK ADA CASHFLOW`)
        continue
      }

      const receivedDate = po.receivedDate
      const cashDate = cashTx.date

      // Check if dates match (same day)
      const isSameDay =
        receivedDate &&
        receivedDate.getDate() === cashDate.getDate() &&
        receivedDate.getMonth() === cashDate.getMonth() &&
        receivedDate.getFullYear() === cashDate.getFullYear()

      if (isSameDay) {
        correctDates++
      } else {
        wrongDates++
        issues.push({
          poNumber: po.poNumber,
          receivedDate,
          cashDate,
          po,
          cashTx,
        })
      }
    }

    console.log('═══════════════════════════════════════')
    console.log(`✅ Tanggal BENAR: ${correctDates}`)
    console.log(`❌ Tanggal SALAH: ${wrongDates}`)
    console.log('═══════════════════════════════════════\n')

    if (wrongDates > 0) {
      console.log('DETAIL TANGGAL YANG SALAH:\n')
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.poNumber}`)
        console.log(
          `   Tanggal PO Received: ${issue.receivedDate?.toLocaleDateString('id-ID') || 'NULL'}`
        )
        console.log(`   Tanggal Cashflow:    ${issue.cashDate.toLocaleDateString('id-ID')}`)
        console.log(`   Amount: Rp ${Number(issue.po.totalAmount).toLocaleString('id-ID')}`)
        console.log()
      })

      console.log('\n⚠️ PERLU DIPERBAIKI!')
      console.log('Tanggal cashflow harus sama dengan tanggal PO received')
    } else {
      console.log('✅ Semua tanggal cashflow PO sudah BENAR!')
      console.log('Tanggal cashflow sesuai dengan tanggal PO received\n')

      // Show some examples
      console.log('Contoh 5 transaksi pertama:')
      for (let i = 0; i < Math.min(5, pos.length); i++) {
        const po = pos[i]
        const cashTx = await prisma.cashTransaction.findFirst({
          where: { referenceId: po.id, referenceType: 'PurchaseOrder' },
        })

        if (cashTx) {
          console.log(`${i + 1}. ${po.poNumber}`)
          console.log(`   Tanggal Received: ${po.receivedDate?.toLocaleDateString('id-ID')}`)
          console.log(`   Tanggal Cashflow: ${cashTx.date.toLocaleDateString('id-ID')}`)
          console.log(`   ✅ SESUAI`)
          console.log()
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPOCashflowDates()
