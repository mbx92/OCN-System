import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

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
  console.log('✅ Created owner:', owner.email)

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
  console.log('✅ Created admin:', admin.email)

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
  console.log('✅ Created technician user:', tech1User.email)

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
  console.log('✅ Created technician profile:', tech1.name)

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
  console.log('✅ Created technician:', tech2User.name)

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
    },
  })
  console.log('✅ Created company settings')

  // Create sample products
  const products = [
    {
      sku: 'CCTV-HIK-2MP',
      name: 'CCTV Hikvision 2MP Indoor',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 350000,
      sellingPrice: 450000,
    },
    {
      sku: 'CCTV-HIK-4MP',
      name: 'CCTV Hikvision 4MP Indoor',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 550000,
      sellingPrice: 700000,
    },
    {
      sku: 'CCTV-HIK-2MP-OUT',
      name: 'CCTV Hikvision 2MP Outdoor',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 450000,
      sellingPrice: 600000,
    },
    {
      sku: 'DVR-HIK-4CH',
      name: 'DVR Hikvision 4 Channel',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 750000,
      sellingPrice: 950000,
    },
    {
      sku: 'DVR-HIK-8CH',
      name: 'DVR Hikvision 8 Channel',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 1200000,
      sellingPrice: 1500000,
    },
    {
      sku: 'NVR-HIK-8CH',
      name: 'NVR Hikvision 8 Channel',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 1800000,
      sellingPrice: 2300000,
    },
    {
      sku: 'HDD-1TB',
      name: 'HDD WD Purple 1TB',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 650000,
      sellingPrice: 800000,
    },
    {
      sku: 'HDD-2TB',
      name: 'HDD WD Purple 2TB',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 950000,
      sellingPrice: 1200000,
    },
    {
      sku: 'CAB-RG59',
      name: 'Kabel RG59+Power',
      category: 'ACCESSORIES',
      unit: 'meter',
      purchasePrice: 3000,
      sellingPrice: 5000,
    },
    {
      sku: 'CAB-UTP-CAT6',
      name: 'Kabel UTP Cat6',
      category: 'NETWORK',
      unit: 'meter',
      purchasePrice: 2500,
      sellingPrice: 4000,
    },
    {
      sku: 'SWITCH-8',
      name: 'Switch 8 Port Gigabit',
      category: 'NETWORK',
      unit: 'pcs',
      purchasePrice: 250000,
      sellingPrice: 350000,
    },
    {
      sku: 'ROUTER-MIK',
      name: 'Router Mikrotik RB750Gr3',
      category: 'NETWORK',
      unit: 'pcs',
      purchasePrice: 800000,
      sellingPrice: 1000000,
    },
    {
      sku: 'AP-UNIFI',
      name: 'Access Point Ubiquiti UniFi',
      category: 'NETWORK',
      unit: 'pcs',
      purchasePrice: 1200000,
      sellingPrice: 1500000,
    },
    {
      sku: 'SRV-INSTALL',
      name: 'Jasa Instalasi',
      category: 'SERVICE',
      unit: 'lot',
      purchasePrice: 0,
      sellingPrice: 500000,
    },
    {
      sku: 'SRV-CONFIG',
      name: 'Jasa Konfigurasi',
      category: 'SERVICE',
      unit: 'lot',
      purchasePrice: 0,
      sellingPrice: 300000,
    },
  ]

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    })

    // Create stock entry with consistent quantity
    const stockQty = Math.floor(Math.random() * 50) + 5
    await prisma.stock.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        quantity: stockQty,
        reserved: 0,
        available: stockQty, // available = quantity - reserved
      },
    })
  }
  console.log('✅ Created sample products with stock')

  // Create sample suppliers
  const suppliers = [
    {
      name: 'PT Hikvision Indonesia',
      contactPerson: 'Pak David',
      phone: '021-12345678',
      email: 'sales@hikvision.co.id',
      address: 'Jakarta',
    },
    {
      name: 'Synnex Metrodata',
      contactPerson: 'Bu Sari',
      phone: '021-87654321',
      email: 'sales@synnex.co.id',
      address: 'Jakarta',
    },
    {
      name: 'Toko Elektronik Jaya',
      contactPerson: 'Pak Anton',
      phone: '081234567899',
      email: 'jaya@gmail.com',
      address: 'Surabaya',
    },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: supplier.name.toLowerCase().replace(/\s+/g, '-'),
        ...supplier,
      },
    })
  }
  console.log('✅ Created sample suppliers')

  // Create sample customers
  const customers = [
    {
      name: 'PT Maju Bersama',
      companyName: 'PT Maju Bersama',
      phone: '021-1111111',
      email: 'contact@majubersama.com',
      address: 'Jl. Sudirman No. 123, Jakarta',
    },
    {
      name: 'Toko Sejahtera',
      companyName: 'CV Sejahtera Abadi',
      phone: '081222333444',
      email: null,
      address: 'Jl. Gatot Subroto No. 45, Bandung',
    },
    {
      name: 'Bapak Agus',
      companyName: null,
      phone: '081333444555',
      email: 'agus@gmail.com',
      address: 'Jl. Pahlawan No. 67, Surabaya',
    },
  ]

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer,
    })
  }
  console.log('✅ Created sample customers')

  // Create sample units
  const units = [
    { name: 'pcs', symbol: 'pcs', description: 'Pieces / satuan', isBase: true },
    { name: 'box', symbol: 'box', description: 'Kotak / dus', isBase: false },
    { name: 'roll', symbol: 'roll', description: 'Gulungan', isBase: false },
    { name: 'meter', symbol: 'm', description: 'Meter', isBase: true },
    { name: 'bungkus', symbol: 'bks', description: 'Bungkus / pack', isBase: false },
    { name: 'set', symbol: 'set', description: 'Satu set lengkap', isBase: true },
    { name: 'unit', symbol: 'unit', description: 'Unit', isBase: true },
    { name: 'lot', symbol: 'lot', description: 'Lot / paket jasa', isBase: true },
  ]

  const createdUnits: Record<string, string> = {}
  for (const unit of units) {
    const created = await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    })
    createdUnits[unit.name] = created.id
  }
  console.log('✅ Created sample units')

  // Create unit conversions
  const conversions = [
    { fromUnit: 'box', toUnit: 'meter', factor: 305, notes: '1 box kabel = 305 meter' },
    { fromUnit: 'roll', toUnit: 'meter', factor: 100, notes: '1 roll kabel = 100 meter' },
    { fromUnit: 'bungkus', toUnit: 'pcs', factor: 100, notes: '1 bungkus RJ45 = 100 pcs' },
  ]

  for (const conv of conversions) {
    const fromUnitId = createdUnits[conv.fromUnit]
    const toUnitId = createdUnits[conv.toUnit]
    if (fromUnitId && toUnitId) {
      await prisma.unitConversion.upsert({
        where: {
          fromUnitId_toUnitId: { fromUnitId, toUnitId },
        },
        update: {},
        create: {
          fromUnitId,
          toUnitId,
          factor: conv.factor,
          notes: conv.notes,
        },
      })
    }
  }
  console.log('✅ Created unit conversions')

  // Create sample quotations
  const allCustomers = await prisma.customer.findMany()
  const allProducts = await prisma.product.findMany()

  // Create product lookup by SKU
  const productBySku = new Map(allProducts.map(p => [p.sku, p]))

  if (allCustomers.length > 0) {
    const customer1 = allCustomers[0]

    await prisma.quotation.upsert({
      where: { quotationNo: 'QT-202512-001' },
      update: {},
      create: {
        quotationNo: 'QT-202512-001',
        customerId: customer1.id,
        title: 'Instalasi CCTV 4 Camera',
        items: [
          {
            productId: productBySku.get('CCTV-HIK-2MP')?.id,
            name: 'CCTV Hikvision 2MP Indoor',
            quantity: 4,
            unit: 'pcs',
            price: 450000,
            total: 1800000,
            description: 'Camera indoor dengan resolusi 2MP',
          },
          {
            productId: productBySku.get('DVR-HIK-4CH')?.id,
            name: 'DVR Hikvision 4 Channel',
            quantity: 1,
            unit: 'pcs',
            price: 950000,
            total: 950000,
            description: 'DVR untuk 4 channel camera',
          },
          {
            productId: productBySku.get('HDD-1TB')?.id,
            name: 'HDD WD Purple 1TB',
            quantity: 1,
            unit: 'pcs',
            price: 800000,
            total: 800000,
            description: 'Harddisk untuk penyimpanan rekaman',
          },
          {
            productId: productBySku.get('CAB-RG59')?.id,
            name: 'Kabel RG59+Power',
            quantity: 100,
            unit: 'meter',
            price: 5000,
            total: 500000,
            description: 'Kabel untuk instalasi camera',
          },
          {
            productId: productBySku.get('SRV-INSTALL')?.id,
            name: 'Jasa Instalasi',
            quantity: 1,
            unit: 'lot',
            price: 500000,
            total: 500000,
            description: 'Instalasi dan konfigurasi sistem',
          },
        ],
        totalAmount: 4550000,
        status: 'SENT',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        notes: 'Termasuk garansi instalasi 1 tahun',
      },
    })

    if (allCustomers.length > 1) {
      const customer2 = allCustomers[1]
      await prisma.quotation.upsert({
        where: { quotationNo: 'QT-202512-002' },
        update: {},
        create: {
          quotationNo: 'QT-202512-002',
          customerId: customer2.id,
          title: 'Setup Network & WiFi',
          items: [
            {
              productId: productBySku.get('ROUTER-MIK')?.id,
              name: 'Router Mikrotik RB750Gr3',
              quantity: 1,
              unit: 'pcs',
              price: 1000000,
              total: 1000000,
              description: 'Router untuk manajemen jaringan',
            },
            {
              productId: productBySku.get('AP-UNIFI')?.id,
              name: 'Access Point Ubiquiti UniFi',
              quantity: 2,
              unit: 'pcs',
              price: 1500000,
              total: 3000000,
              description: 'Access point untuk WiFi coverage',
            },
            {
              productId: productBySku.get('CAB-UTP-CAT6')?.id,
              name: 'Kabel UTP Cat6',
              quantity: 150,
              unit: 'meter',
              price: 4000,
              total: 600000,
              description: 'Kabel networking',
            },
            {
              productId: productBySku.get('SRV-INSTALL')?.id,
              name: 'Jasa Instalasi',
              quantity: 1,
              unit: 'lot',
              price: 500000,
              total: 500000,
              description: 'Instalasi dan konfigurasi jaringan',
            },
            {
              productId: productBySku.get('SRV-CONFIG')?.id,
              name: 'Jasa Konfigurasi',
              quantity: 1,
              unit: 'lot',
              price: 300000,
              total: 300000,
              description: 'Konfigurasi routing dan WiFi',
            },
          ],
          totalAmount: 5400000,
          status: 'DRAFT',
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          notes: 'Garansi perangkat 1 tahun, garansi instalasi 3 bulan',
        },
      })
    }

    console.log('✅ Created sample quotations with productId links')
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
