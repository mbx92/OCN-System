import { PrismaClient } from '@prisma/client'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// ============ UTILITY FUNCTIONS ============

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

function parseDate(value: any): Date {
  if (!value) return new Date()

  // Handle Excel serial number dates
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000)
  }

  // Handle Indonesian date format like "Kamis, 18 Desember 2025"
  if (typeof value === 'string') {
    const months: { [key: string]: number } = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
    }

    // Try Indonesian format: "Kamis, 18 Desember 2025" or "18 Desember 2025"
    const indoMatch = value.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i)
    if (indoMatch) {
      const day = parseInt(indoMatch[1])
      const monthName = indoMatch[2].toLowerCase()
      const year = parseInt(indoMatch[3])
      if (months[monthName] !== undefined) {
        return new Date(year, months[monthName], day)
      }
    }

    // Try standard date format
    const date = new Date(value)
    if (!isNaN(date.getTime())) return date
  }

  return new Date()
}

function parseDecimal(value: any): number {
  if (typeof value === 'number') return value
  if (!value) return 0
  // Remove thousand separators and parse
  const parsed = parseFloat(
    String(value)
      .replace(/[.,]/g, m => (m === ',' ? '' : '.'))
      .replace(/[^0-9.-]/g, '')
  )
  return isNaN(parsed) ? 0 : parsed
}

function generateProjectNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `PRJ-${year}${month}${day}-${String(sequence).padStart(3, '0')}`
}

function generatePaymentNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `PAY-${year}${month}${day}-${String(sequence).padStart(3, '0')}`
}

// ============ FIND OR CREATE ============

async function findOrCreateCustomer(name: string): Promise<string> {
  if (!name || name.trim() === '') {
    throw new Error('Customer name is required')
  }

  let customer = await prisma.customer.findFirst({
    where: { name: { contains: name.trim(), mode: 'insensitive' } },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: '',
        address: '',
      },
    })
    console.log(`   📝 Created customer: ${name}`)
  }

  return customer.id
}

async function findOrCreateProduct(name: string, price: number): Promise<string> {
  if (!name || name.trim() === '') {
    throw new Error('Product name is required')
  }

  let product = await prisma.product.findFirst({
    where: { name: { contains: name.trim(), mode: 'insensitive' } },
  })

  if (!product) {
    // Generate SKU
    const count = await prisma.product.count()
    const sku = `ITM${String(count + 1).padStart(6, '0')}`

    // Determine if it's a service
    const isService =
      name.toLowerCase().includes('ongkos') ||
      name.toLowerCase().includes('jasa') ||
      name.toLowerCase().includes('pasang') ||
      name.toLowerCase().includes('setting')

    product = await prisma.product.create({
      data: {
        sku,
        name: name.trim(),
        category: isService ? 'Jasa' : 'Material',
        unit: 'unit',
        sellingPrice: price,
        purchasePrice: 0,
        type: isService ? 'SERVICE' : 'PRODUCT',
        isService,
      },
    })
    console.log(`   📦 Created product: ${name}`)
  }

  return product.id
}

// ============ MAIN IMPORT ============

interface TransactionRow {
  // Customer & Date
  customer?: string
  pelanggan?: string
  nama?: string
  tanggal?: string
  date?: string

  // Item details
  barang?: string
  item?: string
  nama_barang?: string
  harga?: number
  price?: number
  jumlah?: number
  qty?: number
  quantity?: number
  total?: number

  // Payment info
  metode?: string
  method?: string
  notes?: string
  catatan?: string
  status?: string
}

async function importTransactions(filePath: string) {
  console.log('\n📥 Importing Transactions...')
  const rawData = readExcelFile(filePath)

  if (rawData.length === 0) {
    console.log('⚠️  No data found')
    return 0
  }

  let projectsCreated = 0
  let paymentsCreated = 0
  let errors: string[] = []

  // Group transactions by customer + date
  const transactionGroups = new Map<
    string,
    {
      customer: string
      date: Date
      items: Array<{ name: string; price: number; qty: number; total: number }>
      totalAmount: number
    }
  >()

  for (const row of rawData) {
    try {
      const customerName =
        row.customer || row.pelanggan || row.nama || row.Customer || row.Pelanggan || row.Nama || ''
      const dateValue = row.tanggal || row.date || row.Tanggal || row.Date || ''
      const itemName = row.barang || row.item || row.nama_barang || row.Barang || row.Item || ''
      const price = parseDecimal(row.harga || row.price || row.Harga || row.Price || 0)
      const qty = parseDecimal(row.jumlah || row.qty || row.quantity || row.Jumlah || row.Qty || 1)
      const total = parseDecimal(row.total || row.Total || price * qty)

      if (!customerName || !itemName) continue

      const date = parseDate(dateValue)
      const key = `${customerName}|${date.toISOString().slice(0, 10)}`

      if (!transactionGroups.has(key)) {
        transactionGroups.set(key, {
          customer: customerName,
          date,
          items: [],
          totalAmount: 0,
        })
      }

      const group = transactionGroups.get(key)!
      group.items.push({ name: itemName, price, qty, total })
      group.totalAmount += total
    } catch (error: any) {
      errors.push(`Row error: ${error.message}`)
    }
  }

  console.log(`\n📊 Found ${transactionGroups.size} unique transactions\n`)

  // Process each transaction group
  let projectSeq = 1
  let paymentSeq = 1

  for (const [key, transaction] of transactionGroups) {
    try {
      console.log(
        `📝 Processing: ${transaction.customer} - ${transaction.date.toLocaleDateString('id-ID')}`
      )

      // 1. Find or create customer
      const customerId = await findOrCreateCustomer(transaction.customer)

      // 2. Generate project number based on date
      const projectNumber = generateProjectNumber(transaction.date, projectSeq++)

      // Check if project already exists
      const existingProject = await prisma.project.findUnique({
        where: { projectNumber },
      })

      if (existingProject) {
        console.log(`   ⚠️ Project exists: ${projectNumber}`)
        continue
      }

      // 3. Create project
      const project = await prisma.project.create({
        data: {
          projectNumber,
          customerId,
          title: `Transaksi ${transaction.customer}`,
          description: `Import dari data historis`,
          status: 'PAID',
          budget: transaction.totalAmount,
          finalPrice: transaction.totalAmount,
          startDate: transaction.date,
          endDate: transaction.date,
          createdAt: transaction.date,
          updatedAt: transaction.date,
        },
      })
      projectsCreated++
      console.log(`   ✅ Project: ${projectNumber}`)

      // 4. Create project items
      for (const item of transaction.items) {
        const productId = await findOrCreateProduct(item.name, item.price)

        await prisma.projectItem.create({
          data: {
            projectId: project.id,
            productId,
            name: item.name,
            quantity: item.qty,
            unit: 'unit',
            price: item.price,
            totalPrice: item.total,
            type: 'PRODUCT',
            addedAt: transaction.date,
          },
        })
      }
      console.log(`   ✅ Items: ${transaction.items.length}`)

      // 5. Create payment
      const paymentNumber = generatePaymentNumber(transaction.date, paymentSeq++)

      await prisma.payment.create({
        data: {
          paymentNumber,
          projectId: project.id,
          amount: transaction.totalAmount,
          method: 'CASH',
          type: 'FULL',
          mode: 'PROJECT',
          status: 'PAID',
          paymentDate: transaction.date,
          paidDate: transaction.date,
          createdAt: transaction.date,
          notes: 'Import historis',
        },
      })
      paymentsCreated++
      console.log(
        `   ✅ Payment: ${paymentNumber} - Rp ${transaction.totalAmount.toLocaleString('id-ID')}`
      )

      // 6. Create cash transaction
      await prisma.cashTransaction.create({
        data: {
          type: 'INCOME',
          category: 'PAYMENT',
          amount: transaction.totalAmount,
          description: `Pembayaran ${paymentNumber} - ${transaction.customer}`,
          reference: paymentNumber,
          referenceType: 'Payment',
          date: transaction.date,
          createdAt: transaction.date,
        },
      })

      console.log('')
    } catch (error: any) {
      errors.push(`${transaction.customer}: ${error.message}`)
      console.log(`   ❌ Error: ${error.message}\n`)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('📊 Import Summary:')
  console.log(`   ✅ Projects created: ${projectsCreated}`)
  console.log(`   ✅ Payments created: ${paymentsCreated}`)
  console.log(`   ❌ Errors: ${errors.length}`)
  console.log('═══════════════════════════════════════════════════════════')

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`)
    }
  }

  return projectsCreated + paymentsCreated
}

// ============ MAIN ============

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('     📂 OCN SYSTEM - Transaction Import Tool')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  const importDir = path.join(process.cwd(), 'docs', 'import')

  // Create import directory if not exists
  if (!fs.existsSync(importDir)) {
    fs.mkdirSync(importDir, { recursive: true })
  }

  // Look for transaction files
  const transactionFile = path.join(importDir, 'transaksi.xlsx')

  if (!fs.existsSync(transactionFile)) {
    console.log('⚠️  File tidak ditemukan: docs/import/transaksi.xlsx')
    console.log('')
    console.log('📋 Format Excel yang dibutuhkan:')
    console.log('   ┌─────────────┬────────────────────────────────┬─────────┬────────┬──────────┐')
    console.log('   │ customer    │ barang                         │ harga   │ jumlah │ tanggal  │')
    console.log('   ├─────────────┼────────────────────────────────┼─────────┼────────┼──────────┤')
    console.log('   │ Kubu Dangin │ Ongkos Pasang & Setting        │ 115000  │ 2      │ 18/12/25 │')
    console.log('   │ Kubu Dangin │ Barrel Outdoor                 │ 37500   │ 2      │ 18/12/25 │')
    console.log('   │ Pak Budi    │ Instalasi CCTV 4CH             │ 5000000 │ 1      │ 15/03/25 │')
    console.log('   └─────────────┴────────────────────────────────┴─────────┴────────┴──────────┘')
    console.log('')
    console.log('Simpan file dengan nama: docs/import/transaksi.xlsx')
    return
  }

  await importTransactions(transactionFile)
}

main()
  .catch(e => {
    console.error('❌ Import error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
