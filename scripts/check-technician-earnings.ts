import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Technician Payments Status...\n')

  // Check Project Assignments
  const assignments = await prisma.projectTechnician.findMany({
    select: {
      id: true,
      fee: true,
      isPaid: true,
      technician: {
        select: {
          name: true,
        },
      },
      project: {
        select: {
          projectNumber: true,
          status: true,
        },
      },
    },
  })

  console.log('📋 Project Assignments:')
  console.table(
    assignments.map(a => ({
      Technician: a.technician.name,
      Project: a.project.projectNumber,
      Status: a.project.status,
      Fee: a.fee,
      'Is Paid': a.isPaid ? 'YES' : 'NO',
    }))
  )

  // Check Technician Payments
  const payments = await prisma.technicianPayment.findMany({
    select: {
      id: true,
      amount: true,
      status: true,
      paidDate: true,
      period: true,
      technician: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log('\n💰 Technician Payments:')
  if (payments.length === 0) {
    console.log('❌ No technician payments found!')
  } else {
    console.table(
      payments.map(p => ({
        Technician: p.technician.name,
        Amount: p.amount,
        Status: p.status,
        Period: p.period,
        'Paid Date': p.paidDate ? p.paidDate.toISOString().split('T')[0] : '-',
      }))
    )
  }

  // Calculate totals
  console.log('\n📊 Summary per Technician:')
  const technicians = await prisma.technician.findMany({
    select: {
      name: true,
      assignments: {
        where: {
          isPaid: true,
        },
        select: {
          fee: true,
        },
      },
      payments: {
        where: {
          status: 'PAID',
        },
        select: {
          amount: true,
        },
      },
    },
  })

  const summary = technicians.map(t => {
    const fromAssignments = t.assignments.reduce((sum, a) => sum + Number(a.fee), 0)
    const fromPayments = t.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    return {
      Technician: t.name,
      'From Assignments': `Rp ${fromAssignments.toLocaleString('id-ID')}`,
      'From Payments': `Rp ${fromPayments.toLocaleString('id-ID')}`,
      Total: `Rp ${(fromAssignments + fromPayments).toLocaleString('id-ID')}`,
    }
  })

  console.table(summary)

  console.log('\n💡 Conclusion:')
  const hasUnpaidAssignments = assignments.some(a => !a.isPaid)
  const hasPaidPayments = payments.some(p => p.status === 'PAID')

  if (!hasPaidPayments && hasUnpaidAssignments) {
    console.log(
      '✅ Total Pendapatan = Rp 0 karena:\n   - Belum ada TechnicianPayment dengan status PAID\n   - Belum ada ProjectTechnician dengan isPaid = true'
    )
    console.log(
      '\n📝 Untuk menambah pendapatan teknisi:\n   1. Bayar teknisi melalui halaman "Pembayaran Teknisi" (Finance → Pembayaran Teknisi)\n   2. Atau tandai assignment proyek sebagai sudah dibayar'
    )
  } else if (hasPaidPayments || !hasUnpaidAssignments) {
    console.log('✅ Ada pembayaran yang sudah dibayar')
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
