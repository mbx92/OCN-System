import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating user accounts for technicians...\n')

  const technicians = await prisma.technician.findMany({
    where: {
      userId: null, // Only technicians without user account
      type: 'INTERNAL', // Only internal technicians
    },
  })

  console.log(`Found ${technicians.length} internal technicians without user account\n`)

  for (const tech of technicians) {
    console.log(`\nTechnician: ${tech.name}`)

    // Generate username from name (lowercase, no spaces)
    const username = tech.name.toLowerCase().replace(/\s+/g, '')

    // Generate email
    const email = `${username}@technician.local`

    // Default password: "technician123"
    const defaultPassword = 'technician123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    try {
      // Create user account
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name: tech.name,
          phone: tech.phone,
          role: 'TECHNICIAN',
          isActive: true,
        },
      })

      console.log(`✅ User created:`)
      console.log(`   - Username: ${username}`)
      console.log(`   - Email: ${email}`)
      console.log(`   - Password: ${defaultPassword} (CHANGE THIS!)`)

      // Link technician to user
      await prisma.technician.update({
        where: { id: tech.id },
        data: { userId: user.id },
      })

      console.log(`✅ Technician linked to user account`)
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`)
      if (error.code === 'P2002') {
        console.log(`   Username or email already exists, skipping...`)
      }
    }
  }

  console.log('\n\n📋 SUMMARY - Login Credentials:')
  console.log('='.repeat(60))

  const allTechs = await prisma.technician.findMany({
    where: { type: 'INTERNAL' },
    include: { user: true },
  })

  for (const tech of allTechs) {
    if (tech.user) {
      console.log(`\nName: ${tech.name}`)
      console.log(`Username: ${tech.user.username}`)
      console.log(`Password: technician123 (default - please change!)`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('⚠️  IMPORTANT: Tell technicians to change their password after first login!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
