import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function testLogin() {
  const username = 'kocet'
  const password = 'technician123'

  console.log(`Testing login for: ${username}`)

  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: username }, { username: username }],
    },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log('\n✅ User found:')
  console.log('  - ID:', user.id)
  console.log('  - Username:', user.username)
  console.log('  - Email:', user.email)
  console.log('  - Role:', user.role)
  console.log('  - Active:', user.isActive)
  console.log('  - Password hash:', user.password.substring(0, 20) + '...')

  // Test password
  const isValid = await bcrypt.compare(password, user.password)
  console.log('\nPassword test:')
  console.log('  - Input password:', password)
  console.log('  - Valid:', isValid ? '✅ YES' : '❌ NO')

  if (!isValid) {
    // Try to hash the password and compare the hashes
    const newHash = await bcrypt.hash(password, 10)
    console.log('\n  - New hash would be:', newHash.substring(0, 20) + '...')
  }
}

testLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
