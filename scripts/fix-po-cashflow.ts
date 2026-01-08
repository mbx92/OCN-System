import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing missing cash transactions for RECEIVED POs...\n')

  // Get all RECEIVED POs without cash transaction
  const receivedPOs = await prisma.purchaseOrder.findMany({
    where: {
      status: 'RECEIVED',
    },
  })

  let fixed = 0
  let skipped = 0

  for (const po of receivedPOs) {
    // Check if cash transaction already exists
    const existingTx = await prisma.cashTransaction.findFirst({
      where: {
        referenceId: po.id,
        referenceType: 'PurchaseOrder',
      },
    })

    if (existingTx) {
      console.log(`✓ ${po.poNumber} - Already has cash transaction, skipping`)
      skipped++
      continue
    }

    // Create missing cash transaction
    await prisma.cashTransaction.create({
      data: {
        type: 'EXPENSE',
        category: 'PO',
        amount: po.totalAmount,
        description: `Pembelian ${po.poNumber}`,
        reference: po.poNumber,
        referenceType: 'PurchaseOrder',
        referenceId: po.id,
        date: po.receivedDate || new Date(),
      },
    })

    console.log(
      `✓ ${po.poNumber} - Created cash transaction: Rp ${Number(po.totalAmount).toLocaleString('id-ID')}`
    )
    fixed++
  }

  console.log(`\n✅ Fixed ${fixed} missing transactions`)
  console.log(`⏭️  Skipped ${skipped} existing transactions`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
