import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('ðŸŒ± Starting database seed...')

  // Create owner account
  const ownerPassword = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      email: 'owner@ocn.com',
      username: 'owner',
      password: ownerPassword,
      name: 'Business Owner',
      role: 'OWNER',
      phone: '081234567890',
    },
  })
  console.log('âœ… Created owner:', owner.email)

  // Create admin account
  const adminPassword = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      email: 'admin@ocn.com',
      username: 'admin',
      password: adminPassword,
      name: 'Administrator',
      role: 'ADMIN',
      phone: '081234567891',
    },
  })
  console.log('âœ… Created admin:', admin.email)

  // Create technician user
  const techPassword = await bcrypt.hash('password123', 10)
  const tech1User = await prisma.user.upsert({
    where: { username: 'tech1' },
    update: {},
    create: {
      email: 'tech1@ocn.com',
      username: 'tech1',
      password: techPassword,
      name: 'Andi Teknisi',
      role: 'TECHNICIAN',
      phone: '081234567892',
    },
  })
  console.log('âœ… Created technician user:', tech1User.email)

  // Create technician profile
  const tech1 = await prisma.technician.upsert({
    where: { userId: tech1User.id },
    update: {},
    create: {
      userId: tech1User.id,
      name: 'Andi Teknisi',
      phone: '081234567892',
      type: 'FREELANCE',
      feeType: 'PERCENTAGE',
      feePercentage: 10,
      minFee: 150000,
      canViewProjects: true,
      canViewEarnings: true,
    },
  })
  console.log('âœ… Created technician profile:', tech1.name)

  // Create second technician
  const tech2User = await prisma.user.upsert({
    where: { username: 'tech2' },
    update: {},
    create: {
      email: 'tech2@ocn.com',
      username: 'tech2',
      password: techPassword,
      name: 'Budi Teknisi',
      role: 'TECHNICIAN',
      phone: '081234567893',
    },
  })

  await prisma.technician.upsert({
    where: { userId: tech2User.id },
    update: {},
    create: {
      userId: tech2User.id,
      name: 'Budi Teknisi',
      phone: '081234567893',
      type: 'FREELANCE',
      feeType: 'PERCENTAGE',
      feePercentage: 12,
      minFee: 150000,
      canViewProjects: true,
      canViewEarnings: true,
    },
  })
  console.log('âœ… Created technician:', tech2User.name)

  // Create company settings
  await prisma.company.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'OCN CCTV & Networking',
      settings: {
        companyFundPercentage: 35,
        defaultTechnicianFee: 10,
        minTechnicianFee: 150000,
        currency: 'IDR',
        paymentMethods: ['CASH', 'TRANSFER'],
        quotationValidDays: 14,
      },
