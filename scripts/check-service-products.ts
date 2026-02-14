import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkServiceProducts() {
  try {
    console.log('🔍 Checking service products...\n')

    // Cari products yang kemungkinan service tapi belum diset isService
    const serviceKeywords = [
      'instalasi',
      'maintenance',
      'service',
      'krimping',
      'pasang',
      'repair',
      'setting',
    ]

    for (const keyword of serviceKeywords) {
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          sku: true,
          name: true,
          isService: true,
          _count: {
            select: {
              projectItems: true,
            },
          },
        },
      })

      if (products.length > 0) {
        console.log(`\n📋 Products dengan kata "${keyword}":\n`)
        products.forEach(p => {
          const status = p.isService ? '✅ Service' : '❌ Bukan Service (perlu diupdate!)'
          console.log(
            `${status} - ${p.name} (${p.sku}) - Dipakai di ${p._count.projectItems} project`
          )
        })
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY:\n')

    const allServices = await prisma.product.findMany({
      where: { isService: true },
      select: { name: true },
    })

    console.log(`Total produk yang sudah ditandai sebagai service: ${allServices.length}`)
    allServices.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.name}`)
    })

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkServiceProducts()
