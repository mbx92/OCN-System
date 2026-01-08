import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing missing cash transactions for Assets...\n')

  // Get all assets without cash transaction
  const assets = await prisma.asset.findMany({
    orderBy: {
      purchaseDate: 'desc',
    },
  })

  let fixed = 0
  let skipped = 0

  for (const asset of assets) {
    // Check if cash transaction already exists
    const existingTx = await prisma.cashTransaction.findFirst({
      where: {
        referenceId: asset.id,
        referenceType: 'Asset',
      },
    })

    if (existingTx) {
      console.log(`✓ ${asset.assetNumber} - ${asset.name} - Already has cash transaction, skipping`)
      skipped++
      continue
    }

    // Create missing cash transaction
    await prisma.cashTransaction.create({
      data: {
        type: 'EXPENSE',
        category: 'ASSET',
        amount: asset.purchasePrice,
        description: `Pembelian Asset: ${asset.name}`,
        reference: asset.assetNumber,
        referenceType: 'Asset',
        referenceId: asset.id,
        date: asset.purchaseDate,
      },
    })

    console.log(
      `✓ ${asset.assetNumber} - ${asset.name} - Created cash transaction: Rp ${Number(asset.purchasePrice).toLocaleString('id-ID')}`
    )
    fixed++
  }

  console.log(`\n✅ Fixed ${fixed} missing transactions`)
  console.log(`⏭️  Skipped ${skipped} existing transactions`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
