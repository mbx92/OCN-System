import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking payment status distribution...\n')

  // Get all payments grouped by status
  const payments = await prisma.payment.findMany({
    select: {
      id: true,
      amount: true,
      status: true,
      paymentDate: true,
      dueDate: true,
      paidDate: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  console.log('Last 20 payments:')
  payments.forEach((p) => {
    console.log(
      `ID: ${p.id}, Status: ${p.status}, Amount: ${p.amount}, DueDate: ${p.dueDate}, PaidDate: ${p.paidDate}`
    )
  })

  console.log('\n\nStatus distribution:')
  const statusCounts = await prisma.payment.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  })

  statusCounts.forEach((s) => {
    console.log(`${s.status}: ${s._count.id} payments, Total: Rp ${s._sum.amount}`)
  })

  // Check unpaid specifically
  console.log('\n\nUnpaid payments (UNPAID, PARTIAL, OVERDUE):')
  const unpaid = await prisma.payment.findMany({
    where: {
      status: {
        in: ['UNPAID', 'PARTIAL', 'OVERDUE'],
      },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      paymentDate: true,
      dueDate: true,
    },
  })

  console.log(`Found ${unpaid.length} unpaid payments:`)
  unpaid.forEach((p) => {
    console.log(`ID: ${p.id}, Status: ${p.status}, Amount: ${p.amount}, DueDate: ${p.dueDate}`)
  })

  const total = unpaid.reduce((sum, p) => sum + Number(p.amount), 0)
  console.log(`\nTotal unpaid: Rp ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
