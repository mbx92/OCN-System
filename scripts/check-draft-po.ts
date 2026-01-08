import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking DRAFT POs for testing edit quantity...\n')

  const draftPos = await prisma.purchaseOrder.findMany({
    where: {
      status: 'DRAFT',
    },
    include: {
      supplier: true,
      items: true,
      project: {
        select: {
          projectNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (draftPos.length === 0) {
    console.log('❌ No DRAFT POs found. Creating a sample DRAFT PO...\n')

    // Get supplier and product
    const supplier = await prisma.supplier.findFirst()
    const products = await prisma.product.findMany({ take: 2 })

    if (!supplier || products.length < 2) {
      console.log('⚠️ Need at least 1 supplier and 2 products to create sample PO')
      return
    }

    // Create sample PO
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const count = await prisma.purchaseOrder.count()
    const poNumber = `PO-${year}${month}-${String(count + 1).padStart(3, '0')}`

    const samplePo = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier.id,
        status: 'DRAFT',
        totalAmount: 0, // Will be calculated
        items: {
          create: [
            {
              productId: products[0].id,
              name: products[0].name,
              quantity: 5,
              price: parseFloat(products[0].purchasePrice.toString()),
              total: 5 * parseFloat(products[0].purchasePrice.toString()),
            },
            {
              productId: products[1].id,
              name: products[1].name,
              quantity: 10,
              price: parseFloat(products[1].purchasePrice.toString()),
              total: 10 * parseFloat(products[1].purchasePrice.toString()),
            },
          ],
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    })

    // Calculate and update total
    const total = samplePo.items.reduce((sum, item) => sum + parseFloat(item.total.toString()), 0)
    await prisma.purchaseOrder.update({
      where: { id: samplePo.id },
      data: { totalAmount: total },
    })

    console.log(`✅ Created sample DRAFT PO: ${poNumber}\n`)

    // Refetch to show
    const updatedPos = await prisma.purchaseOrder.findMany({
      where: { status: 'DRAFT' },
      include: {
        supplier: true,
        items: true,
        project: { select: { projectNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    displayPos(updatedPos)
  } else {
    console.log(`✅ Found ${draftPos.length} DRAFT PO(s):\n`)
    displayPos(draftPos)
  }

  console.log('\n💡 How to test Edit Quantity:')
  console.log('   1. Open Purchase Orders page in browser')
  console.log('   2. Click on a DRAFT PO')
  console.log('   3. Click on any quantity number to edit')
  console.log('   4. Change the value and press Enter or click ✓')
  console.log('   5. Total will automatically recalculate!')
}

function displayPos(pos: any[]) {
  for (const po of pos) {
    console.log(`📋 ${po.poNumber} - ${po.supplier.name}`)
    console.log(`   Status: ${po.status}`)
    console.log(`   Total: Rp ${parseFloat(po.totalAmount.toString()).toLocaleString('id-ID')}`)
    console.log(`   Items (${po.items.length}):`)
    for (const item of po.items) {
      console.log(
        `     - ${item.name}: ${item.quantity} x Rp ${parseFloat(item.price.toString()).toLocaleString('id-ID')} = Rp ${parseFloat(item.total.toString()).toLocaleString('id-ID')}`
      )
    }
    console.log()
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
