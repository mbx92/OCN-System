/**
 * Test script to verify company logo is stored and fetched correctly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCompanyLogo() {
  try {
    console.log('Fetching company data...')
    const company = await prisma.company.findFirst()

    if (!company) {
      console.log('❌ No company found in database')
      return
    }

    console.log('✅ Company found:', company.name)
    console.log('Company ID:', company.id)

    const settings = company.settings as any

    console.log('\nCompany Settings:')
    console.log('- Address:', settings.address || '(empty)')
    console.log('- Phone:', settings.phone || '(empty)')
    console.log('- Email:', settings.email || '(empty)')
    console.log('- Logo exists:', !!settings.logo)
    console.log('- Logo length:', settings.logo?.length || 0)
    console.log('- Logo format:', settings.logo?.substring(0, 50) || '(empty)')

    if (settings.logo && settings.logo.startsWith('data:image')) {
      console.log('✅ Logo is in correct base64 format')
    } else if (settings.logo) {
      console.log('⚠️  Logo exists but not in data:image format')
    } else {
      console.log('❌ Logo is empty')
    }

    console.log('\nFull settings object:')
    console.log(JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCompanyLogo()
