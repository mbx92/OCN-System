import * as XLSX from 'xlsx'
import * as path from 'path'

async function generateExcelTemplate() {
  console.log('📝 GENERATE EXCEL TEMPLATE FOR PROJECT IMPORT\n')

  // Sample data for Projects sheet
  const projectsData = [
    {
      'Project Ref': 'P001', // Nomor referensi untuk link ke items
      'Customer ID': '', // Atau kosongkan jika mau auto-create
      'Customer Name': 'PT. Contoh Indonesia', // Nama customer (wajib jika Customer ID kosong)
      'Project Title': 'Instalasi CCTV Kantor', // Wajib
      'Description': 'Instalasi 8 unit CCTV di kantor pusat', // Opsional
      'Budget': 15000000, // Angka saja (atau kosongkan, akan auto-calculate dari items)
      'Project Date': '2025-01-15', // Format: YYYY-MM-DD
      'Start Date': '2025-01-20', // Opsional, format: YYYY-MM-DD
      'End Date': '2025-01-30', // Opsional, format: YYYY-MM-DD
      'Status': 'APPROVED', // APPROVED / ONGOING / COMPLETED
    },
    {
      'Project Ref': 'P002',
      'Customer ID': '',
      'Customer Name': 'Toko ABC',
      'Project Title': 'Instalasi Network',
      'Description': 'Setting jaringan komputer dan WiFi',
      'Budget': '', // Kosong = auto dari items
      'Project Date': '2025-02-01',
      'Start Date': '',
      'End Date': '',
      'Status': 'APPROVED',
    },
  ]

  // Sample data for Items sheet
  const itemsData = [
    {
      'Project Ref': 'P001', // Harus sama dengan Project Ref di sheet Projects
      'Item Name': 'Camera HIKVISION 2MP Indoor',
      'Quantity': 8,
      'Unit': 'Unit',
      'Price': 1500000, // Harga jual per unit
      'Cost': 1200000, // HPP per unit (opsional)
      'Product ID': '', // Opsional, jika mau link ke product master
      'Needs PO': 'Ya', // Ya/Tidak - apakah perlu PO
    },
    {
      'Project Ref': 'P001',
      'Item Name': 'Instalasi CCTV',
      'Quantity': 1,
      'Unit': 'Paket',
      'Price': 3000000,
      'Cost': 500000,
      'Product ID': '',
      'Needs PO': 'Tidak',
    },
    {
      'Project Ref': 'P002',
      'Item Name': 'Switch 24 Port',
      'Quantity': 2,
      'Unit': 'Unit',
      'Price': 2500000,
      'Cost': 2000000,
      'Product ID': '',
      'Needs PO': 'Ya',
    },
    {
      'Project Ref': 'P002',
      'Item Name': 'Access Point WiFi',
      'Quantity': 4,
      'Unit': 'Unit',
      'Price': 800000,
      'Cost': 650000,
      'Product ID': '',
      'Needs PO': 'Ya',
    },
  ]

  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Create Projects worksheet
  const wsProjects = XLSX.utils.json_to_sheet(projectsData)
  wsProjects['!cols'] = [
    { wch: 12 }, // Project Ref
    { wch: 15 }, // Customer ID
    { wch: 25 }, // Customer Name
    { wch: 35 }, // Project Title
    { wch: 40 }, // Description
    { wch: 15 }, // Budget
    { wch: 15 }, // Project Date
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
    { wch: 12 }, // Status
  ]
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects')

  // Create Items worksheet
  const wsItems = XLSX.utils.json_to_sheet(itemsData)
  wsItems['!cols'] = [
    { wch: 12 }, // Project Ref
    { wch: 35 }, // Item Name
    { wch: 10 }, // Quantity
    { wch: 10 }, // Unit
    { wch: 15 }, // Price
    { wch: 15 }, // Cost
    { wch: 20 }, // Product ID
    { wch: 12 }, // Needs PO
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Items')

  // Write to file
  const filePath = path.join(process.cwd(), 'import-projects-2025.xlsx')
  XLSX.writeFile(wb, filePath)

  console.log(`✅ Template Excel berhasil dibuat: ${filePath}\n`)
  console.log('📋 FORMAT EXCEL - ADA 2 SHEETS:\n')
  console.log('━'.repeat(70))
  console.log('\n📄 SHEET 1: PROJECTS')
  console.log('Kolom yang WAJIB diisi:')
  console.log('  - Project Ref: Nomor unik untuk link ke items (contoh: P001, P002)')
  console.log('  - Customer Name: Nama customer (jika Customer ID kosong)')
  console.log('  - Project Title: Judul project')
  console.log('  - Project Date: Tanggal project (format: YYYY-MM-DD)')
  console.log('\nKolom OPSIONAL:')
  console.log('  - Customer ID: ID customer jika sudah tahu')
  console.log('  - Description: Deskripsi project')
  console.log('  - Budget: Budget total (kosongkan = auto dari items)')
  console.log('  - Start Date: Tanggal mulai')
  console.log('  - End Date: Tanggal selesai')
  console.log('  - Status: APPROVED (default) / ONGOING / COMPLETED')
  
  console.log('\n━'.repeat(70))
  console.log('\n📄 SHEET 2: ITEMS')
  console.log('Kolom yang WAJIB diisi:')
  console.log('  - Project Ref: Harus sama dengan Project Ref di sheet Projects')
  console.log('  - Item Name: Nama item/barang/jasa')
  console.log('  - Quantity: Jumlah')
  console.log('  - Unit: Satuan (Unit, pcs, Set, Meter, dll)')
  console.log('  - Price: Harga jual per unit')
  console.log('\nKolom OPSIONAL:')
  console.log('  - Cost: HPP/Modal per unit')
  console.log('  - Product ID: ID produk jika mau link ke master produk')
  console.log('  - Needs PO: Ya/Tidak - apakah item ini perlu Purchase Order')
  
  console.log('\n━'.repeat(70))
  console.log('\n💡 TIPS:')
  console.log('  ✓ Satu project bisa punya banyak items (gunakan Project Ref yang sama)')
  console.log('  ✓ Budget project akan otomatis dihitung dari total items')
  console.log('  ✓ Hapus baris contoh dan isi dengan data sebenarnya')
  console.log('\n▶️  Setelah selesai edit, jalankan:')
  console.log('   npx tsx scripts/import-projects-2025.ts')
}

generateExcelTemplate()
