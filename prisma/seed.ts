import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seed...')

  // ==================== CLEANUP ====================
  console.log('🗑️  Cleaning up existing data...')
  // Delete in correct order (respect foreign keys)
  // First, delete tables that reference User
  await prisma.expense.deleteMany()
  await prisma.session.deleteMany()
  await prisma.activity.deleteMany()
  // Delete warranty-related tables
  await prisma.warrantyClaim.deleteMany()
  await prisma.warranty.deleteMany()
  // Delete payment tables
  await prisma.technicianPayment.deleteMany()
  await prisma.payment.deleteMany()
  // Delete asset table
  await prisma.asset.deleteMany()
  // Delete project-related tables
  await prisma.financialSummary.deleteMany()
  await prisma.projectTechnician.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.projectExpense.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.projectItem.deleteMany()
  await prisma.project.deleteMany()
  await prisma.customer.deleteMany()
  // Delete product-related tables
  await prisma.stockMovement.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.supplierProduct.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  // Delete unit tables
  await prisma.unitConversion.deleteMany()
  await prisma.unit.deleteMany()
  // Delete remaining tables
  await prisma.company.deleteMany()
  await prisma.technician.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleanup complete')

  // ==================== USERS & TECHNICIANS ====================
  const ownerPassword = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.create({
    data: {
      email: 'owner@ocn.com',
      username: 'owner',
      password: ownerPassword,
      name: 'Budi Santoso',
      role: 'OWNER',
      phone: '081234567890',
    },
  })
  console.log('✅ Owner:', owner.email)

  const adminPassword = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ocn.com',
      username: 'admin',
      password: adminPassword,
      name: 'Siti Admin',
      role: 'ADMIN',
      phone: '081234567891',
    },
  })
  console.log('✅ Admin:', admin.email)

  // Technician 1 - Internal with PERCENTAGE fee
  const techPassword = await bcrypt.hash('password123', 10)
  const tech1User = await prisma.user.create({
    data: {
      email: 'andi@ocn.com',
      username: 'andi',
      password: techPassword,
      name: 'Andi Wijaya',
      role: 'TECHNICIAN',
      phone: '081234567892',
    },
  })

  const tech1 = await prisma.technician.create({
    data: {
      userId: tech1User.id,
      name: 'Andi Wijaya',
      phone: '081234567892',
      type: 'INTERNAL',
      feeType: 'PERCENTAGE',
      feePercentage: 15,
      minFee: 200000,
      canViewProjects: true,
      canViewEarnings: true,
    },
  })
  console.log('✅ Technician (Internal):', tech1.name)

  // Technician 2 - Freelance with FIXED fee
  const tech2User = await prisma.user.create({
    data: {
      email: 'budi@ocn.com',
      username: 'budi',
      password: techPassword,
      name: 'Budi Hartono',
      role: 'TECHNICIAN',
      phone: '081234567893',
    },
  })

  const tech2 = await prisma.technician.create({
    data: {
      userId: tech2User.id,
      name: 'Budi Hartono',
      phone: '081234567893',
      type: 'FREELANCE',
      feeType: 'FIXED',
      minFee: 500000,
      canViewProjects: true,
      canViewEarnings: false,
    },
  })
  console.log('✅ Technician (Freelance):', tech2.name)

  // Technician 3 - Freelance with PERCENTAGE
  const tech3User = await prisma.user.create({
    data: {
      email: 'charlie@ocn.com',
      username: 'charlie',
      password: techPassword,
      name: 'Charlie Pranata',
      role: 'TECHNICIAN',
      phone: '081234567894',
    },
  })

  const tech3 = await prisma.technician.create({
    data: {
      userId: tech3User.id,
      name: 'Charlie Pranata',
      phone: '081234567894',
      type: 'FREELANCE',
      feeType: 'PERCENTAGE',
      feePercentage: 12,
      minFee: 150000,
      canViewProjects: false,
      canViewEarnings: false,
    },
  })
  console.log('✅ Technician (Freelance):', tech3.name)

  // ==================== COMPANY SETTINGS ====================
  await prisma.company.create({
    data: {
      id: 'default',
      name: 'OCN CCTV & Networking Solutions',
      settings: {
        companyFundPercentage: 30,
        defaultTechnicianFee: 15,
        minTechnicianFee: 150000,
        currency: 'IDR',
        paymentMethods: ['CASH', 'TRANSFER', 'TEMPO'],
        quotationValidDays: 14,
      },
    },
  })
  console.log('✅ Company settings')

  // ==================== UNITS ====================
  const units = [
    { name: 'pcs', symbol: 'pcs', description: 'Pieces / satuan', isBase: true },
    { name: 'unit', symbol: 'unit', description: 'Unit', isBase: true },
    { name: 'set', symbol: 'set', description: 'Satu set lengkap', isBase: true },
    { name: 'box', symbol: 'box', description: 'Kotak / dus', isBase: false },
    { name: 'roll', symbol: 'roll', description: 'Gulungan', isBase: false },
    { name: 'meter', symbol: 'm', description: 'Meter', isBase: true },
    { name: 'bungkus', symbol: 'bks', description: 'Bungkus / pack', isBase: false },
    { name: 'lot', symbol: 'lot', description: 'Lot / paket jasa', isBase: true },
    { name: 'buah', symbol: 'buah', description: 'Buah', isBase: true },
    { name: 'lusin', symbol: 'lusin', description: 'Lusin (12 pcs)', isBase: false },
  ]

  const createdUnits: Record<string, string> = {}
  for (const unit of units) {
    const created = await prisma.unit.create({
      data: unit,
    })
    createdUnits[unit.name] = created.id
  }
  console.log('✅ Units created')

  // Unit conversions
  const conversions = [
    { fromUnit: 'box', toUnit: 'meter', factor: 305, notes: '1 box kabel = 305 meter' },
    { fromUnit: 'roll', toUnit: 'meter', factor: 100, notes: '1 roll kabel = 100 meter' },
    { fromUnit: 'bungkus', toUnit: 'pcs', factor: 100, notes: '1 bungkus connector = 100 pcs' },
    { fromUnit: 'lusin', toUnit: 'pcs', factor: 12, notes: '1 lusin = 12 pcs' },
  ]

  for (const conv of conversions) {
    const fromUnitId = createdUnits[conv.fromUnit]
    const toUnitId = createdUnits[conv.toUnit]
    if (fromUnitId && toUnitId) {
      await prisma.unitConversion.create({
        data: { fromUnitId, toUnitId, factor: conv.factor, notes: conv.notes },
      })
    }
  }
  console.log('✅ Unit conversions created')

  // ==================== SUPPLIERS ====================
  const suppliers = [
    {
      id: 'hikvision-indonesia',
      name: 'PT Hikvision Indonesia',
      contactPerson: 'David Tan',
      phone: '021-29341234',
      email: 'sales@hikvision.co.id',
      address: 'Menara Hijau, Jakarta Selatan',
    },
    {
      id: 'synnex-metrodata',
      name: 'Synnex Metrodata Indonesia',
      contactPerson: 'Sari Wijaya',
      phone: '021-87654321',
      email: 'sales@synnex.co.id',
      address: 'Gedung Plaza, Jakarta Pusat',
    },
    {
      id: 'toko-elektronik-jaya',
      name: 'Toko Elektronik Jaya',
      contactPerson: 'Anton Susanto',
      phone: '081234567899',
      email: 'jaya@gmail.com',
      address: 'Jl. Basuki Rahmat 45, Surabaya',
    },
    {
      id: 'cv-network-sentral',
      name: 'CV Network Sentral',
      contactPerson: 'Dewi Lestari',
      phone: '081298765432',
      email: 'network@sentral.com',
      address: 'Jl. Cihampelas 123, Bandung',
    },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.create({
      data: supplier,
    })
  }
  console.log('✅ Suppliers created')

  // ==================== PRODUCTS (PRODUCT type) ====================
  const productItems = [
    {
      sku: 'CAM-HIK-2MP-IN',
      name: 'CCTV Hikvision 2MP Indoor Dome',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 350000,
      sellingPrice: 550000,
      minStock: 10,
      stock: 45,
    },
    {
      sku: 'CAM-HIK-4MP-IN',
      name: 'CCTV Hikvision 4MP Indoor Dome',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 550000,
      sellingPrice: 800000,
      minStock: 5,
      stock: 30,
    },
    {
      sku: 'CAM-HIK-2MP-OUT',
      name: 'CCTV Hikvision 2MP Outdoor Bullet',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 450000,
      sellingPrice: 700000,
      minStock: 8,
      stock: 25,
    },
    {
      sku: 'CAM-HIK-5MP-OUT',
      name: 'CCTV Hikvision 5MP Outdoor Turret',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 750000,
      sellingPrice: 1100000,
      minStock: 5,
      stock: 15,
    },
    {
      sku: 'DVR-HIK-4CH',
      name: 'DVR Hikvision 4 Channel Turbo HD',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'unit',
      purchasePrice: 750000,
      sellingPrice: 1100000,
      minStock: 3,
      stock: 12,
    },
    {
      sku: 'DVR-HIK-8CH',
      name: 'DVR Hikvision 8 Channel Turbo HD',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'unit',
      purchasePrice: 1200000,
      sellingPrice: 1700000,
      minStock: 3,
      stock: 8,
    },
    {
      sku: 'DVR-HIK-16CH',
      name: 'DVR Hikvision 16 Channel Turbo HD',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'unit',
      purchasePrice: 2000000,
      sellingPrice: 2800000,
      minStock: 2,
      stock: 5,
    },
    {
      sku: 'NVR-HIK-8CH-POE',
      name: 'NVR Hikvision 8 Channel PoE 4K',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'unit',
      purchasePrice: 2500000,
      sellingPrice: 3500000,
      minStock: 2,
      stock: 6,
    },
    {
      sku: 'HDD-WD-1TB',
      name: 'HDD WD Purple 1TB Surveillance',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 650000,
      sellingPrice: 900000,
      minStock: 5,
      stock: 20,
    },
    {
      sku: 'HDD-WD-2TB',
      name: 'HDD WD Purple 2TB Surveillance',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 950000,
      sellingPrice: 1300000,
      minStock: 5,
      stock: 15,
    },
    {
      sku: 'HDD-WD-4TB',
      name: 'HDD WD Purple 4TB Surveillance',
      type: 'PRODUCT',
      category: 'CCTV',
      unit: 'pcs',
      purchasePrice: 1800000,
      sellingPrice: 2400000,
      minStock: 3,
      stock: 8,
    },
    {
      sku: 'SWITCH-TPL-8P',
      name: 'TP-Link Switch 8 Port Gigabit',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 250000,
      sellingPrice: 400000,
      minStock: 5,
      stock: 18,
    },
    {
      sku: 'SWITCH-TPL-16P',
      name: 'TP-Link Switch 16 Port Gigabit',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 500000,
      sellingPrice: 750000,
      minStock: 3,
      stock: 10,
    },
    {
      sku: 'ROUTER-MIK-RB750',
      name: 'MikroTik RouterBoard RB750Gr3',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 800000,
      sellingPrice: 1150000,
      minStock: 3,
      stock: 12,
    },
    {
      sku: 'ROUTER-MIK-RB951',
      name: 'MikroTik RouterBoard RB951Ui-2HnD',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 650000,
      sellingPrice: 950000,
      minStock: 3,
      stock: 8,
    },
    {
      sku: 'AP-UBNT-UAP-AC',
      name: 'Ubiquiti UniFi AP AC Lite',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 1200000,
      sellingPrice: 1700000,
      minStock: 5,
      stock: 15,
    },
    {
      sku: 'AP-UBNT-UAP-AC-PRO',
      name: 'Ubiquiti UniFi AP AC Pro',
      type: 'PRODUCT',
      category: 'NETWORK',
      unit: 'unit',
      purchasePrice: 2000000,
      sellingPrice: 2700000,
      minStock: 3,
      stock: 8,
    },
  ]

  // ==================== MATERIALS (MATERIAL type) ====================
  const materialItems = [
    {
      sku: 'CAB-RG59-POWER',
      name: 'Kabel RG59 + Power CCTV',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'meter',
      purchasePrice: 3000,
      sellingPrice: 5500,
      minStock: 200,
      stock: 850,
    },
    {
      sku: 'CAB-UTP-CAT6',
      name: 'Kabel UTP Cat6 Outdoor',
      type: 'MATERIAL',
      category: 'NETWORK',
      unit: 'meter',
      purchasePrice: 2500,
      sellingPrice: 4500,
      minStock: 300,
      stock: 1200,
    },
    {
      sku: 'CAB-UTP-CAT5E',
      name: 'Kabel UTP Cat5e Indoor',
      type: 'MATERIAL',
      category: 'NETWORK',
      unit: 'meter',
      purchasePrice: 1800,
      sellingPrice: 3500,
      minStock: 200,
      stock: 600,
    },
    {
      sku: 'CONN-RJ45',
      name: 'Connector RJ45 Cat6',
      type: 'MATERIAL',
      category: 'NETWORK',
      unit: 'pcs',
      purchasePrice: 500,
      sellingPrice: 1000,
      minStock: 100,
      stock: 450,
    },
    {
      sku: 'CONN-BNC',
      name: 'Connector BNC CCTV',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'pcs',
      purchasePrice: 800,
      sellingPrice: 1500,
      minStock: 100,
      stock: 380,
    },
    {
      sku: 'MAT-PAKU-FISCHER',
      name: 'Paku Beton Fischer S8',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'pcs',
      purchasePrice: 500,
      sellingPrice: 1200,
      minStock: 200,
      stock: 650,
    },
    {
      sku: 'MAT-CABLE-TIES-20',
      name: 'Cable Ties 20cm Hitam',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'pcs',
      purchasePrice: 100,
      sellingPrice: 300,
      minStock: 500,
      stock: 2000,
    },
    {
      sku: 'MAT-CABLE-TIES-30',
      name: 'Cable Ties 30cm Putih',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'pcs',
      purchasePrice: 150,
      sellingPrice: 400,
      minStock: 300,
      stock: 1200,
    },
    {
      sku: 'MAT-PIPA-PVC-3-4',
      name: 'Pipa PVC 3/4 inch',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'meter',
      purchasePrice: 8000,
      sellingPrice: 13000,
      minStock: 50,
      stock: 180,
    },
    {
      sku: 'MAT-PIPA-PVC-1',
      name: 'Pipa PVC 1 inch',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'meter',
      purchasePrice: 10000,
      sellingPrice: 16000,
      minStock: 50,
      stock: 150,
    },
    {
      sku: 'MAT-DUCT-CABLE',
      name: 'Cable Duct 40x40mm',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'meter',
      purchasePrice: 15000,
      sellingPrice: 25000,
      minStock: 30,
      stock: 120,
    },
    {
      sku: 'MAT-BOX-JUNCTION',
      name: 'Junction Box Outdoor',
      type: 'MATERIAL',
      category: 'ACCESSORIES',
      unit: 'pcs',
      purchasePrice: 12000,
      sellingPrice: 20000,
      minStock: 20,
      stock: 85,
    },
  ]

  // ==================== SERVICES (SERVICE type) ====================
  const serviceItems = [
    {
      sku: 'SRV-INSTALL-CCTV',
      name: 'Jasa Instalasi CCTV',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 500000,
      minStock: 0,
      stock: 0,
    },
    {
      sku: 'SRV-INSTALL-NETWORK',
      name: 'Jasa Instalasi Network',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 400000,
      minStock: 0,
      stock: 0,
    },
    {
      sku: 'SRV-CONFIG-ROUTER',
      name: 'Jasa Konfigurasi Router & Firewall',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 350000,
      minStock: 0,
      stock: 0,
    },
    {
      sku: 'SRV-CONFIG-WIFI',
      name: 'Jasa Konfigurasi WiFi Management',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 300000,
      minStock: 0,
      stock: 0,
    },
    {
      sku: 'SRV-MAINTAIN-MONTHLY',
      name: 'Jasa Maintenance Bulanan',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 750000,
      minStock: 0,
      stock: 0,
    },
    {
      sku: 'SRV-REPAIR',
      name: 'Jasa Perbaikan & Troubleshooting',
      type: 'SERVICE',
      category: 'SERVICE',
      unit: null,
      purchasePrice: 0,
      sellingPrice: 250000,
      minStock: 0,
      stock: 0,
    },
  ]

  // Create all products, materials, and services
  const allItems = [...productItems, ...materialItems, ...serviceItems]
  const createdProducts: Record<string, any> = {}

  for (const item of allItems) {
    const { stock: stockQty, ...productData } = item
    const created = await prisma.product.create({
      data: productData,
    })
    createdProducts[item.sku] = created

    // Create stock only for PRODUCT and MATERIAL types
    if (item.type !== 'SERVICE') {
      await prisma.stock.create({
        data: {
          productId: created.id,
          quantity: stockQty,
          reserved: 0,
          available: stockQty,
        },
      })
    }
  }
  console.log(
    `✅ Products: ${productItems.length}, Materials: ${materialItems.length}, Services: ${serviceItems.length}`
  )

  // ==================== CUSTOMERS ====================
  const customers = [
    {
      name: 'PT Maju Sejahtera',
      companyName: 'PT Maju Sejahtera Indonesia',
      phone: '021-55551111',
      email: 'procurement@majusejahtera.co.id',
      address: 'Jl. Sudirman Kav 52-53, Jakarta Selatan 12190',
    },
    {
      name: 'CV Toko Elektronik Bersama',
      companyName: 'CV Toko Elektronik Bersama',
      phone: '021-77778888',
      email: 'bersama@gmail.com',
      address: 'Jl. Gatot Subroto No. 125, Bandung 40262',
    },
    {
      name: 'Bapak Agus Setiawan',
      companyName: null,
      phone: '081333444555',
      email: 'agus.setiawan@gmail.com',
      address: 'Jl. Pahlawan No. 67, Surabaya 60174',
    },
    {
      name: 'Ibu Dewi Lestari',
      companyName: null,
      phone: '081298765432',
      email: 'dewi.lestari@yahoo.com',
      address: 'Jl. Veteran No. 234, Yogyakarta 55164',
    },
    {
      name: 'PT Teknologi Digital',
      companyName: 'PT Teknologi Digital Indonesia',
      phone: '021-33334444',
      email: 'info@teknodigital.co.id',
      address: 'Menara BCA Lt. 15, Jakarta Pusat 10310',
    },
  ]

  const createdCustomers: any[] = []
  for (const customer of customers) {
    const created = await prisma.customer.create({ data: customer })
    createdCustomers.push(created)
  }
  console.log(`✅ Customers: ${customers.length}`)

  // ==================== QUOTATIONS ====================
  // Quotation 1: CCTV Installation for Office
  const quot1 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2025-001',
      customerId: createdCustomers[0].id,
      title: 'Instalasi CCTV Kantor 8 Camera',
      items: [
        {
          productId: createdProducts['CAM-HIK-2MP-IN'].id,
          name: 'CCTV Hikvision 2MP Indoor Dome',
          quantity: 6,
          unit: 'pcs',
          price: 550000,
          cost: 350000,
          total: 3300000,
          totalCost: 2100000,
          description: 'Camera indoor untuk area office',
        },
        {
          productId: createdProducts['CAM-HIK-2MP-OUT'].id,
          name: 'CCTV Hikvision 2MP Outdoor Bullet',
          quantity: 2,
          unit: 'pcs',
          price: 700000,
          cost: 450000,
          total: 1400000,
          totalCost: 900000,
          description: 'Camera outdoor untuk parkir & entrance',
        },
        {
          productId: createdProducts['DVR-HIK-8CH'].id,
          name: 'DVR Hikvision 8 Channel Turbo HD',
          quantity: 1,
          unit: 'unit',
          price: 1700000,
          cost: 1200000,
          total: 1700000,
          totalCost: 1200000,
          description: 'DVR 8 channel untuk recording',
        },
        {
          productId: createdProducts['HDD-WD-2TB'].id,
          name: 'HDD WD Purple 2TB Surveillance',
          quantity: 1,
          unit: 'pcs',
          price: 1300000,
          cost: 950000,
          total: 1300000,
          totalCost: 950000,
          description: 'Storage untuk recording 30 hari',
        },
        {
          productId: createdProducts['CAB-RG59-POWER'].id,
          name: 'Kabel RG59 + Power CCTV',
          quantity: 150,
          unit: 'meter',
          price: 5500,
          cost: 3000,
          total: 825000,
          totalCost: 450000,
          description: 'Kabel instalasi camera',
        },
        {
          productId: createdProducts['CONN-BNC'].id,
          name: 'Connector BNC CCTV',
          quantity: 20,
          unit: 'pcs',
          price: 0,
          cost: 800,
          total: 0,
          totalCost: 16000,
          description: 'Include dalam jasa instalasi',
        },
        {
          productId: createdProducts['SRV-INSTALL-CCTV'].id,
          name: 'Jasa Instalasi CCTV',
          quantity: 1,
          unit: null,
          price: 800000,
          cost: 0,
          total: 800000,
          totalCost: 0,
          description: 'Instalasi, konfigurasi & testing',
        },
      ],
      totalAmount: 9325000,
      status: 'APPROVED',
      validUntil: new Date('2025-01-15'),
      notes: 'Include garansi instalasi 1 tahun, garansi produk sesuai distributor',
    },
  })
  console.log('✅ Quotation 1 (APPROVED):', quot1.quotationNo)

  // Quotation 2: Network Setup
  const quot2 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2025-002',
      customerId: createdCustomers[1].id,
      title: 'Setup Jaringan & WiFi Management Toko',
      items: [
        {
          productId: createdProducts['ROUTER-MIK-RB750'].id,
          name: 'MikroTik RouterBoard RB750Gr3',
          quantity: 1,
          unit: 'unit',
          price: 1150000,
          cost: 800000,
          total: 1150000,
          totalCost: 800000,
        },
        {
          productId: createdProducts['AP-UBNT-UAP-AC'].id,
          name: 'Ubiquiti UniFi AP AC Lite',
          quantity: 3,
          unit: 'unit',
          price: 1700000,
          cost: 1200000,
          total: 5100000,
          totalCost: 3600000,
        },
        {
          productId: createdProducts['SWITCH-TPL-8P'].id,
          name: 'TP-Link Switch 8 Port Gigabit',
          quantity: 1,
          unit: 'unit',
          price: 400000,
          cost: 250000,
          total: 400000,
          totalCost: 250000,
        },
        {
          productId: createdProducts['CAB-UTP-CAT6'].id,
          name: 'Kabel UTP Cat6 Outdoor',
          quantity: 200,
          unit: 'meter',
          price: 4500,
          cost: 2500,
          total: 900000,
          totalCost: 500000,
        },
        {
          productId: createdProducts['CONN-RJ45'].id,
          name: 'Connector RJ45 Cat6',
          quantity: 30,
          unit: 'pcs',
          price: 0,
          cost: 500,
          total: 0,
          totalCost: 15000,
        },
        {
          productId: createdProducts['SRV-INSTALL-NETWORK'].id,
          name: 'Jasa Instalasi Network',
          quantity: 1,
          unit: null,
          price: 400000,
          cost: 0,
          total: 400000,
          totalCost: 0,
        },
        {
          productId: createdProducts['SRV-CONFIG-WIFI'].id,
          name: 'Jasa Konfigurasi WiFi Management',
          quantity: 1,
          unit: null,
          price: 300000,
          cost: 0,
          total: 300000,
          totalCost: 0,
        },
      ],
      totalAmount: 8250000,
      status: 'SENT',
      validUntil: new Date('2025-01-20'),
      notes: 'Include konfigurasi VLAN & guest network',
    },
  })
  console.log('✅ Quotation 2 (SENT):', quot2.quotationNo)

  // Quotation 3: Home CCTV - DRAFT
  const quot3 = await prisma.quotation.create({
    data: {
      quotationNo: 'QT-2025-003',
      customerId: createdCustomers[2].id,
      title: 'Paket CCTV Rumah 4 Camera',
      items: [
        {
          productId: createdProducts['CAM-HIK-2MP-IN'].id,
          name: 'CCTV Hikvision 2MP Indoor Dome',
          quantity: 2,
          unit: 'pcs',
          price: 550000,
          cost: 350000,
          total: 1100000,
          totalCost: 700000,
        },
        {
          productId: createdProducts['CAM-HIK-2MP-OUT'].id,
          name: 'CCTV Hikvision 2MP Outdoor Bullet',
          quantity: 2,
          unit: 'pcs',
          price: 700000,
          cost: 450000,
          total: 1400000,
          totalCost: 900000,
        },
        {
          productId: createdProducts['DVR-HIK-4CH'].id,
          name: 'DVR Hikvision 4 Channel Turbo HD',
          quantity: 1,
          unit: 'unit',
          price: 1100000,
          cost: 750000,
          total: 1100000,
          totalCost: 750000,
        },
        {
          productId: createdProducts['HDD-WD-1TB'].id,
          name: 'HDD WD Purple 1TB Surveillance',
          quantity: 1,
          unit: 'pcs',
          price: 900000,
          cost: 650000,
          total: 900000,
          totalCost: 650000,
        },
        {
          productId: createdProducts['CAB-RG59-POWER'].id,
          name: 'Kabel RG59 + Power CCTV',
          quantity: 80,
          unit: 'meter',
          price: 5500,
          cost: 3000,
          total: 440000,
          totalCost: 240000,
        },
        {
          productId: createdProducts['SRV-INSTALL-CCTV'].id,
          name: 'Jasa Instalasi CCTV',
          quantity: 1,
          unit: null,
          price: 500000,
          cost: 0,
          total: 500000,
          totalCost: 0,
        },
      ],
      totalAmount: 5440000,
      status: 'DRAFT',
      validUntil: new Date('2025-01-10'),
      notes: 'Paket lengkap untuk rumah 2 lantai',
    },
  })
  console.log('✅ Quotation 3 (DRAFT):', quot3.quotationNo)

  // ==================== PROJECT from APPROVED QUOTATION ====================
  const project1 = await prisma.project.create({
    data: {
      projectNumber: 'PRJ-2025-001',
      customerId: createdCustomers[0].id,
      title: quot1.title,
      description: 'Project instalasi CCTV dari quotation QT-2025-001',
      budget: quot1.totalAmount,
      finalPrice: quot1.totalAmount,
      businessCashPercentage: 30,
      status: 'ONGOING',
      startDate: new Date('2025-01-05'),
      items: {
        create: quot1.items.map((item: any) => ({
          ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || '',
          price: item.price,
          cost: item.cost || 0,
          totalPrice: item.total,
          totalCost: item.totalCost || 0,
          type: 'QUOTATION',
        })),
      },
    },
  })
  console.log('✅ Project 1 (ONGOING):', project1.projectNumber)

  // Assign technicians to project
  await prisma.projectTechnician.create({
    data: {
      projectId: project1.id,
      technicianId: tech1.id,
      fee: 25, // 25% dari technician wage
      feeType: 'PERCENTAGE',
      isPaid: false,
    },
  })

  await prisma.projectTechnician.create({
    data: {
      projectId: project1.id,
      technicianId: tech2.id,
      fee: 600000, // Fixed fee
      feeType: 'FIXED',
      isPaid: false,
    },
  })
  console.log('✅ Assigned 2 technicians to project')

  // Reserve stock for project items
  const projectItems = await prisma.projectItem.findMany({
    where: { projectId: project1.id, productId: { not: null } },
    include: { product: { include: { stock: true } } },
  })

  for (const item of projectItems) {
    if (item.productId && item.product && item.product.type !== 'SERVICE') {
      // Update or create stock
      let stock = item.product.stock
      if (stock) {
        const newReserved = stock.reserved + item.quantity
        const newAvailable = stock.quantity - newReserved
        stock = await prisma.stock.update({
          where: { productId: item.productId },
          data: {
            reserved: newReserved,
            available: newAvailable,
          },
        })
      } else {
        stock = await prisma.stock.create({
          data: {
            productId: item.productId,
            quantity: 0,
            reserved: item.quantity,
            available: -item.quantity,
          },
        })
      }

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          stockId: stock.id,
          type: 'RESERVE',
          quantity: -item.quantity,
          reference: project1.projectNumber,
          notes: `Reserved: ${item.name}`,
        },
      })
    }
  }
  console.log('✅ Reserved stock for project items')

  // Add expenses to project
  await prisma.projectExpense.createMany({
    data: [
      {
        projectId: project1.id,
        description: 'Transport instalasi',
        amount: 150000,
        category: 'TRANSPORT',
        date: new Date('2025-01-05'),
      },
      {
        projectId: project1.id,
        description: 'Makan siang tim',
        amount: 100000,
        category: 'OTHER',
        date: new Date('2025-01-05'),
      },
    ],
  })
  console.log('✅ Added expenses to project')

  // ==================== GENERAL EXPENSES ====================
  // Create sample expense data for P&L report
  const expenseData = [
    // Biaya Penjualan (Selling Expenses)
    {
      type: 'OPERATIONAL' as const,
      category: 'Komisi Penjualan',
      description: 'Komisi sales bulan Desember',
      amount: 500000,
      date: new Date('2025-12-15'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'Marketing',
      description: 'Iklan Facebook & Instagram',
      amount: 750000,
      date: new Date('2025-12-10'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'Pemasaran',
      description: 'Biaya cetak brosur',
      amount: 300000,
      date: new Date('2025-12-05'),
      createdBy: owner.id,
    },
    // Biaya Administratif (Administrative Expenses)
    {
      type: 'OPERATIONAL' as const,
      category: 'Sewa Kantor',
      description: 'Sewa kantor bulan Desember',
      amount: 2500000,
      date: new Date('2025-12-01'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'Listrik',
      description: 'Tagihan listrik kantor',
      amount: 450000,
      date: new Date('2025-12-05'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'Internet',
      description: 'Tagihan internet kantor',
      amount: 500000,
      date: new Date('2025-12-05'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'ATK',
      description: 'Pembelian alat tulis kantor',
      amount: 150000,
      date: new Date('2025-12-08'),
      createdBy: owner.id,
    },
    // Salary expenses
    {
      type: 'SALARY' as const,
      category: 'Gaji Staff',
      description: 'Gaji admin bulan Desember',
      amount: 4000000,
      date: new Date('2025-12-25'),
      createdBy: owner.id,
    },
    {
      type: 'SALARY' as const,
      category: 'Gaji Staff',
      description: 'THR karyawan',
      amount: 2000000,
      date: new Date('2025-12-20'),
      createdBy: owner.id,
    },
    // Project related expenses
    {
      type: 'PROJECT' as const,
      category: 'Material Project',
      description: 'Pembelian material tambahan project',
      amount: 850000,
      date: new Date('2025-12-12'),
      createdBy: owner.id,
      projectId: project1.id,
    },
    {
      type: 'PROJECT' as const,
      category: 'Transport Project',
      description: 'Biaya transport ke lokasi project',
      amount: 200000,
      date: new Date('2025-12-14'),
      createdBy: owner.id,
      projectId: project1.id,
    },
    // Expenses for January (for testing different months)
    {
      type: 'OPERATIONAL' as const,
      category: 'Sewa Kantor',
      description: 'Sewa kantor bulan Januari',
      amount: 2500000,
      date: new Date('2025-01-01'),
      createdBy: owner.id,
    },
    {
      type: 'SALARY' as const,
      category: 'Gaji Staff',
      description: 'Gaji admin bulan Januari',
      amount: 4000000,
      date: new Date('2025-01-25'),
      createdBy: owner.id,
    },
    {
      type: 'OPERATIONAL' as const,
      category: 'Listrik',
      description: 'Tagihan listrik Januari',
      amount: 400000,
      date: new Date('2025-01-05'),
      createdBy: owner.id,
    },
  ]

  for (const expense of expenseData) {
    await prisma.expense.create({
      data: expense,
    })
  }
  console.log(`✅ Created ${expenseData.length} general expenses`)

  console.log('\n🎉 Comprehensive seed completed!')
  console.log('\n📊 Summary:')
  console.log(`   Users: 5 (1 owner, 1 admin, 3 technicians)`)
  console.log(`   Products: ${productItems.length}`)
  console.log(`   Materials: ${materialItems.length}`)
  console.log(`   Services: ${serviceItems.length}`)
  console.log(`   Suppliers: ${suppliers.length}`)
  console.log(`   Customers: ${customers.length}`)
  console.log(`   Quotations: 3 (1 approved, 1 sent, 1 draft)`)
  console.log(`   Projects: 1 (ongoing with 2 technicians)`)
  console.log('\n🔑 Login credentials:')
  console.log('   Owner: owner / password123')
  console.log('   Admin: admin / password123')
  console.log('   Tech: andi / password123')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
