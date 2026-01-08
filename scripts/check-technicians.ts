import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking technicians...\n')

  const technicians = await prisma.technician.findMany({
    include: {
      user: true,
    },
  })

  console.log(`Found ${technicians.length} technicians:\n`)

  for (const tech of technicians) {
    console.log(`ID: ${tech.id}`)
    console.log(`Name: ${tech.name}`)
    console.log(`Phone: ${tech.phone}`)
    console.log(`Type: ${tech.type}`)
    console.log(`UserId: ${tech.userId || 'NOT LINKED'}`)

    if (tech.user) {
      console.log(`✅ Has User Account:`)
      console.log(`   - Username: ${tech.user.username}`)
      console.log(`   - Email: ${tech.user.email}`)
      console.log(`   - Role: ${tech.user.role}`)
      console.log(`   - Active: ${tech.user.isActive}`)
    } else {
      console.log(`❌ No User Account - Cannot login`)
    }
    console.log('')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
