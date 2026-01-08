import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking Purchase Orders and Cash Transactions...\n')

  // Get all RECEIVED POs
  const receivedPOs = await prisma.purchaseOrder.findMany({
    where: {
      status: 'RECEIVED',
    },
    orderBy: {
      receivedDate: 'desc',
    },
  })

  console.log(`Found ${receivedPOs.length} RECEIVED Purchase Orders\n`)

  // Check each PO for cash transaction
  for (const po of receivedPOs) {
    const cashTx = await prisma.cashTransaction.findFirst({
      where: {
        referenceId: po.id,
        referenceType: 'PurchaseOrder',
      },
    })

    console.log(`PO: ${po.poNumber}`)
    console.log(`  - Status: ${po.status}`)
    console.log(`  - Amount: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`)
    console.log(`  - Received Date: ${po.receivedDate}`)
    console.log(`  - Cash Transaction: ${cashTx ? '✓ EXISTS' : '✗ MISSING'}`)

    if (!cashTx) {
      console.log(`  - ⚠️ NEED TO CREATE CASH TRANSACTION`)
    }
    console.log('')
  }

  // Get all cash transactions with PO category
  const poCashTx = await prisma.cashTransaction.findMany({
    where: {
      category: 'PO',
    },
    orderBy: {
      date: 'desc',
    },
  })

  console.log(`\nFound ${poCashTx.length} Cash Transactions with category PO:`)
  for (const tx of poCashTx) {
    console.log(
      `  - ${tx.reference}: Rp ${Number(tx.amount).toLocaleString('id-ID')} (${tx.date.toISOString().slice(0, 10)})`
    )
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
