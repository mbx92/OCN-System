import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Fetching users and entities for sample activities...')

  // Get first user
  const users = await prisma.user.findMany({ take: 3 })
  if (users.length === 0) {
    console.log('❌ No users found. Please create users first.')
    return
  }

  // Get some entities
  const customers = await prisma.customer.findMany({ take: 3 })
  const projects = await prisma.project.findMany({ take: 3 })
  const payments = await prisma.payment.findMany({ take: 3 })

  console.log(
    `✅ Found ${users.length} users, ${customers.length} customers, ${projects.length} projects, ${payments.length} payments`
  )

  // Sample activities
  const activities = []

  // Login activities
  for (const user of users) {
    activities.push({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
      metadata: {
        username: user.username,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    })
  }

  // Customer activities
  if (customers.length > 0) {
    for (const customer of customers) {
      activities.push({
        userId: users[0].id,
        action: 'CREATE_CUSTOMER',
        entity: 'Customer',
        entityId: customer.id,
        metadata: {
          name: customer.name,
          phone: customer.phone,
        },
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })
    }
  }

  // Project activities
  if (projects.length > 0) {
    for (const project of projects) {
      // Create project
      activities.push({
        userId: users[0].id,
        action: 'CREATE_PROJECT',
        entity: 'Project',
        entityId: project.id,
        metadata: {
          projectNumber: project.projectNumber,
          title: project.title,
        },
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })

      // Update project
      if (Math.random() > 0.5) {
        activities.push({
          userId: users[Math.floor(Math.random() * users.length)].id,
          action: 'UPDATE_PROJECT',
          entity: 'Project',
          entityId: project.id,
          metadata: {
            projectNumber: project.projectNumber,
            changes: ['status', 'dates'],
          },
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        })
      }

      // Complete project
      if (project.status === 'COMPLETED') {
        activities.push({
          userId: users[0].id,
          action: 'COMPLETE_PROJECT',
          entity: 'Project',
          entityId: project.id,
          metadata: {
            projectNumber: project.projectNumber,
            title: project.title,
          },
          createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        })
      }
    }
  }

  // Payment activities
  if (payments.length > 0) {
    for (const payment of payments) {
      activities.push({
        userId: users[0].id,
        action: 'CREATE_PAYMENT',
        entity: 'Payment',
        entityId: payment.id,
        metadata: {
          paymentNumber: payment.paymentNumber,
          type: payment.type,
          amount: payment.amount,
        },
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      })
    }
  }

  console.log(`📝 Creating ${activities.length} sample activities...`)

  // Create activities
  for (const activity of activities) {
    await prisma.activity.create({
      data: activity,
    })
  }

  console.log(`✅ Successfully created ${activities.length} sample activities!`)
  console.log('🎉 You can now view them in the Activity Logs page')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
