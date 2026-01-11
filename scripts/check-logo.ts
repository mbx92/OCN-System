import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const company = await prisma.company.findFirst()

  console.log('Company Name:', company?.name)

  const settings = company?.settings as any
  if (settings?.logo) {
    console.log('Logo exists: YES')
    console.log('Logo starts with data:image?', settings.logo.startsWith('data:image'))
    console.log('Logo length:', settings.logo.length)
    console.log('Logo preview:', settings.logo.substring(0, 80) + '...')
  } else {
    console.log('Logo exists: NO (not set in database)')
  }
}

main().finally(() => prisma.$disconnect())
