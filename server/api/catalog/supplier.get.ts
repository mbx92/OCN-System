import { defineEventHandler, getQuery } from 'h3'

interface SupplierProduct {
  sku: string
  name: string
  category: string
  price: number
  unit: string
  brand: string
}

// Google Sheets configuration
const SPREADSHEET_ID = '18EC7x3oI6nO0xfhrMud9C6DS5w8jNF1N75FSAOnWUWc'

// All sheets with their GIDs and brand names
const SHEETS = [
  { gid: '657251832', brand: 'HIKVISION' },
  { gid: '320678928', brand: 'TIANDY' },
  { gid: '1944254046', brand: 'DAHUA' },
  { gid: '2129969061', brand: 'IMOU' },
  { gid: '659490177', brand: 'HILOOK' },
  { gid: '2012300951', brand: 'UPS' },
  { gid: '1971491164', brand: 'EZVIZ' },
  { gid: '1702983901', brand: 'RUIJIE' },
  { gid: '425664221', brand: 'TAKASI' },
  { gid: '1244982889', brand: 'MIKROTIK' },
  { gid: '312539993', brand: 'VENTION' },
  { gid: '1558403100', brand: 'TPLINK' },
  { gid: '1181019717', brand: 'FOREDGE' },
  { gid: '2017522553', brand: 'MERCUSYS' },
  { gid: '1364455319', brand: 'ROBOT' },
  { gid: '1601811453', brand: 'HDD' },
  { gid: '1792143993', brand: 'MICROSD' },
  { gid: '1178445138', brand: 'TOA' },
  { gid: '217188596', brand: 'HT' },
  { gid: '849127562', brand: 'ADAPTOR' },
  { gid: '1966647720', brand: 'HDMI CONNLEX/WEBSONG' },
  { gid: '1689093881', brand: 'RAK SERVER' },
  { gid: '379519483', brand: 'PATCHCORD' },
  { gid: '650225977', brand: 'PRECON FIBER' },
  { gid: '858359828', brand: 'KABEL UTP' },
  { gid: '847203131', brand: 'KABEL FTP' },
  { gid: '2088082125', brand: 'COAXIAL' },
]

// Cache configuration
let cachedData: SupplierProduct[] | null = null
let cachedCategories: string[] | null = null
let cachedBrands: string[] | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

// Prices that indicate discontinued/invalid products
const INVALID_PRICES = [0, 1, 86223000, 88889000, 99999999, 79112000, 74667000, 72383000]

async function fetchSheetData(gid: string, brand: string): Promise<SupplierProduct[]> {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`

    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch sheet ${brand}: ${response.status}`)
      return []
    }

    const csvText = await response.text()
    return parseCSV(csvText, brand)
  } catch (error) {
    console.error(`Error fetching sheet ${brand}:`, error)
    return []
  }
}

async function fetchAllGoogleSheetData(): Promise<SupplierProduct[]> {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedData && now - lastFetchTime < CACHE_DURATION) {
    return cachedData
  }

  try {
    // Fetch all sheets in parallel
    const allPromises = SHEETS.map(sheet => fetchSheetData(sheet.gid, sheet.brand))
    const allResults = await Promise.all(allPromises)

    // Combine all products
    const products = allResults.flat()

    // Update cache
    cachedData = products
    cachedCategories = [...new Set(products.map(p => p.category))].filter(Boolean).sort()
    cachedBrands = [...new Set(products.map(p => p.brand))].filter(Boolean).sort()
    lastFetchTime = now

    console.log(`Fetched ${products.length} products from ${SHEETS.length} sheets`)
    return products
  } catch (error) {
    console.error('Error fetching Google Sheets:', error)
    // Return cached data if available, even if expired
    if (cachedData) {
      return cachedData
    }
    throw error
  }
}

function parseCSV(csvText: string, brand: string): SupplierProduct[] {
  const lines = csvText.split('\n')
  const products: SupplierProduct[] = []

  // Find the header row (contains "kode item" or "NAMA ITEM")
  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (line.includes('kode item') && line.includes('nama item')) {
      headerIndex = i
      break
    }
  }

  // If header not found, start from first line
  if (headerIndex === -1) {
    headerIndex = 0
  }

  // Process data rows (skip header)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle quoted values)
    const values = parseCSVLine(line)

    if (values.length >= 4) {
      const [kodeItem, namaItem, jenis, harga] = values

      // Skip empty rows or rows without SKU
      if (!kodeItem || !namaItem) continue

      // Skip if it looks like another header section (brand names, etc)
      if (kodeItem.toLowerCase() === 'kode item') continue

      // Parse price - handle Indonesian format "Rp86,223,000"
      // Remove "Rp", spaces, and dots used as thousands separator
      let cleanPrice = harga?.replace(/Rp\.?\s*/gi, '') || '0'
      // Remove commas used as thousands separator
      cleanPrice = cleanPrice.replace(/,/g, '')
      // Remove any remaining non-numeric characters except decimal point
      cleanPrice = cleanPrice.replace(/[^\d.]/g, '')
      const price = parseFloat(cleanPrice) || 0

      products.push({
        sku: kodeItem?.trim() || '',
        name: namaItem?.trim() || '',
        category: jenis?.trim() || 'Uncategorized',
        price: price,
        unit: 'pcs', // Default unit
        brand: brand,
      })
    }
  }

  // Filter out discontinued products (invalid prices)
  return products.filter(p => !INVALID_PRICES.includes(p.price))
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Push last value
  values.push(current.trim())

  return values
}

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const search = (query.search as string)?.toLowerCase() || ''
  const category = (query.category as string)?.toLowerCase() || ''
  const brand = (query.brand as string)?.toLowerCase() || ''
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50

  try {
    let products = await fetchAllGoogleSheetData()

    // Filter by search
    if (search) {
      products = products.filter(
        p =>
          p.sku.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search)
      )
    }

    // Filter by category
    if (category) {
      products = products.filter(p => p.category.toLowerCase().includes(category))
    }

    // Filter by brand
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase().includes(brand))
    }

    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name))

    // Pagination
    const total = products.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedProducts = products.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedProducts,
      categories: cachedCategories || [],
      brands: cachedBrands || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error('Supplier catalog error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch supplier catalog',
      data: [],
      categories: [],
      brands: [],
    }
  }
})
