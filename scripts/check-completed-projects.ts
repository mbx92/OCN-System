import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking COMPLETED projects and their payments...\n')

  const completedProjects = await prisma.project.findMany({
    where: {
      status: 'COMPLETED',
    },
    include: {
      customer: true,
      payments: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: {
      endDate: 'desc',
    },
  })

  console.log(`Found ${completedProjects.length} COMPLETED projects\n`)

  for (const project of completedProjects) {
    console.log(`Project: ${project.projectNumber} - ${project.title}`)
    console.log(`  Customer: ${project.customer.name}`)
    console.log(`  Completed: ${project.endDate?.toISOString().slice(0, 10) || 'N/A'}`)
    console.log(`  Payments: ${project.payments.length}`)

    if (project.payments.length > 0) {
      const latestPayment = project.payments[project.payments.length - 1]
      console.log(`  Latest Payment:`)
      console.log(`    - Amount: Rp ${Number(latestPayment.amount).toLocaleString('id-ID')}`)
      console.log(`    - Type: ${latestPayment.paymentType}`)
      console.log(`    - Date: ${latestPayment.createdAt.toISOString().slice(0, 10)}`)
      console.log(`  ✓ Can generate PDFs`)
    } else {
      console.log(`  ⚠️ NO PAYMENTS - Cannot generate PDFs`)
    }
    console.log('')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
