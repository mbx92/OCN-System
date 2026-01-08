import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking Assets and Cash Transactions...\n')

  // Get all assets
  const assets = await prisma.asset.findMany({
    orderBy: {
      purchaseDate: 'desc',
    },
  })

  console.log(`Found ${assets.length} Assets\n`)

  let needsFix = 0
  let alreadyHas = 0

  // Check each asset for cash transaction
  for (const asset of assets) {
    const cashTx = await prisma.cashTransaction.findFirst({
      where: {
        referenceId: asset.id,
        referenceType: 'Asset',
      },
    })

    const hasTransaction = cashTx ? '✓ EXISTS' : '✗ MISSING'
    console.log(`Asset: ${asset.assetNumber} - ${asset.name}`)
    console.log(`  - Purchase Price: Rp ${Number(asset.purchasePrice).toLocaleString('id-ID')}`)
    console.log(`  - Purchase Date: ${asset.purchaseDate.toISOString().slice(0, 10)}`)
    console.log(`  - Cash Transaction: ${hasTransaction}`)

    if (!cashTx) {
      console.log(`  - ⚠️ NEED TO CREATE CASH TRANSACTION`)
      needsFix++
    } else {
      alreadyHas++
    }
    console.log('')
  }

  console.log(`\nSummary:`)
  console.log(`  - Assets with cash transaction: ${alreadyHas}`)
  console.log(`  - Assets need fix: ${needsFix}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
