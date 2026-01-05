import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

function readExcelFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return []
  }
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet)
}

async function main() {
  console.log('🌱 Starting database seed from Excel files...')

  const exportDir = path.join(process.cwd(), 'docs', 'export')

  // ==================== CLEANUP ====================
  console.log('🗑️  Cleaning up existing data...')
  await prisma.expense.deleteMany()
  await prisma.session.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.warrantyClaim.deleteMany()
  await prisma.warranty.deleteMany()
  await prisma.technicianPayment.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.financialSummary.deleteMany()
  await prisma.projectTechnician.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.projectExpense.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.projectItem.deleteMany()
  await prisma.project.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.supplierProduct.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.unitConversion.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.company.deleteMany()
  await prisma.technician.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Cleanup complete')

  // ==================== USER ====================
  const ownerPassword = await bcrypt.hash('Nopassword123!', 10)
  const owner = await prisma.user.create({
    data: {
      email: 'owner@ocnetwork.web.id',
      username: 'mbx',
      password: ownerPassword,
      name: 'Owner',
      role: 'OWNER',
      phone: '081234567890',
    },
  })
  console.log('✅ Owner created:', owner.email)

  // ==================== COMPANY ====================
  await prisma.company.create({
    data: {
      id: 'default',
      name: 'OCN CCTV & Networking Solutions',
      settings: {
        companyFundPercentage: 30,
      },
    },
  })
  console.log('✅ Company settings created')

  // ==================== UNITS ====================
  const units = [
    { name: 'Unit', symbol: 'unit', category: 'GENERAL' },
    { name: 'Pieces', symbol: 'pcs', category: 'GENERAL' },
    { name: 'Meter', symbol: 'm', category: 'LENGTH' },
    { name: 'Roll', symbol: 'roll', category: 'GENERAL' },
    { name: 'Box', symbol: 'box', category: 'PACKAGING' },
    { name: 'Set', symbol: 'set', category: 'GENERAL' },
    { name: 'Paket', symbol: 'paket', category: 'GENERAL' },
  ]

  const createdUnits: any = {}
  for (const unit of units) {
    const created = await prisma.unit.create({
      data: {
        name: unit.name,
        symbol: unit.symbol,
      },
    })
    createdUnits[unit.symbol] = created
  }
  console.log('✅ Units created:', units.length)

  // ==================== SUPPLIERS FROM EXCEL ====================
  const supplierFile = path.join(exportDir, 'supexport.xlsx')
  const supplierData = readExcelFile(supplierFile)

  let supplierCount = 0
  for (const sup of supplierData) {
    try {
      await prisma.supplier.create({
        data: {
          name: sup.NAMA || 'Unknown Supplier',
          contactPerson: '',
          phone: '',
          email: '',
          address: `Kode: ${sup.KODE}${sup.JATUHTEMPO ? `, Jatuh Tempo: ${sup.JATUHTEMPO} hari` : ''}`,
        },
      })
      supplierCount++
    } catch (error) {
      console.log(`⚠️  Skipped duplicate supplier: ${sup.KODE}`)
    }
  }
  console.log('✅ Suppliers created from Excel:', supplierCount)

  // ==================== CUSTOMERS FROM EXCEL ====================
  const customerFile = path.join(exportDir, 'custesport.xlsx')
  const customerData = readExcelFile(customerFile)

  let customerCount = 0
  for (const cust of customerData) {
    try {
      await prisma.customer.create({
        data: {
          name: cust.NAMA || 'Unknown Customer',
          companyName: cust.NAMA || '',
          phone: '',
          email: '',
          address: '',
          notes: `Kode: ${cust.KODE}`,
        },
      })
      customerCount++
    } catch (error) {
      console.log(`⚠️  Skipped duplicate customer: ${cust.KODE}`)
    }
  }
  console.log('✅ Customers created from Excel:', customerCount)

  // ==================== PRODUCTS FROM EXCEL ====================
  const itemFile = path.join(exportDir, 'itemexport.xlsx')
  const itemData = readExcelFile(itemFile)

  let productCount = 0
  let materialCount = 0

  for (const item of itemData) {
    try {
      // Determine product type based on JENIS or category
      let productType: 'PRODUCT' | 'MATERIAL' = 'PRODUCT'
      const jenis = (item.JENIS || '').toString().toLowerCase()

      // Materials are usually cables, connectors, accessories
      const materialKeywords = [
        'kabel',
        'cable',
        'connector',
        'konektor',
        'bracket',
        'duct',
        'pipe',
      ]
      if (materialKeywords.some(keyword => jenis.includes(keyword))) {
        productType = 'MATERIAL'
      }

      // Find matching unit or use default
      let unitId = createdUnits['unit'].id
      const satuan = (item.SATUAN || 'unit').toString().toLowerCase()

      for (const [abbr, unit] of Object.entries(createdUnits)) {
        if (satuan.includes(abbr) || abbr.includes(satuan)) {
          unitId = (unit as any).id
          break
        }
      }

      // Determine if item uses serial numbers
      const hasSerialNumber = item.SERIAL === 'Y' || item.SERIAL === 'YES' || item.SERIAL === true

      await prisma.product.create({
        data: {
          sku: `ITM${String(productCount + materialCount + 1).padStart(6, '0')}`,
          name: item.NAMAITEM || 'Unknown Item',
          category: item.JENIS || 'General',
          unit: item.SATUAN || 'unit',
          purchasePrice: parseFloat(item.HARGAPOKOK) || 0,
          sellingPrice: parseFloat(item.HARGAJUAL) || parseFloat(item.HARGAPOKOK) || 0,
          minStock: parseInt(item.STOKMIN) || 0,
          type: productType,
          isService: false,
        },
      })

      if (productType === 'MATERIAL') {
        materialCount++
      } else {
        productCount++
      }
    } catch (error: any) {
      console.log(`⚠️  Skipped item: ${item.NAMAITEM} - ${error.message}`)
    }
  }

  console.log('✅ Products created from Excel:', productCount)
  console.log('✅ Materials created from Excel:', materialCount)

  console.log('\n🎉 Seed from Excel completed!')
  console.log('\n📊 Summary:')
  console.log(`   Suppliers: ${supplierCount}`)
  console.log(`   Customers: ${customerCount}`)
  console.log(`   Products: ${productCount}`)
  console.log(`   Materials: ${materialCount}`)
  console.log(`   Total Items: ${productCount + materialCount}`)
  console.log('\n🔑 Login credentials:')
  console.log('   Username: mbx')
  console.log('   Password: Nopassword123!')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
