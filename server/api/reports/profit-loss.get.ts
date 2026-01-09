import { H3Event } from 'h3'

interface ExpenseItem {
  name: string
  amount: number
}

interface ExpenseCategory {
  items: ExpenseItem[]
  total: number
}

interface ProfitLossReport {
  companyName: string
  periodLabel: string
  data: {
    pendapatanKotor: number
    diskonPenjualan: number
    returPenjualan: number
    penjualanBersih: number
    hpp: number
    hppDetail: ExpenseCategory // Breakdown of HPP (project items cost + project expenses)
    labaKotor: number
    biayaPenjualan: ExpenseCategory
    biayaAdministratif: ExpenseCategory
    biayaProject: ExpenseCategory // Project operational expenses
    totalBiayaOperasional: number
    pendapatanOperasional: number
    pendapatanLainLain: ExpenseCategory
    labaBersih: number
  }
}

// Category mapping based on expense category keywords
function categorizeExpense(
  category: string,
  type: string
): 'penjualan' | 'administratif' | 'lainlain' | 'hpp' {
  const lowerCategory = category.toLowerCase()

  // HPP - Cost of Goods Sold (Project expenses)
  if (type === 'PROJECT') {
    return 'hpp'
  }

  // Biaya Penjualan (Selling Expenses)
  const sellingKeywords = ['komisi', 'marketing', 'iklan', 'pemasaran', 'promosi', 'sales']
  if (sellingKeywords.some(k => lowerCategory.includes(k))) {
    return 'penjualan'
  }

  // Pendapatan/Beban Lain-lain
  const otherKeywords = ['bunga', 'interest', 'investasi', 'lain']
  if (otherKeywords.some(k => lowerCategory.includes(k))) {
    return 'lainlain'
  }

  // Default to administratif
  return 'administratif'
}

// Get expense display name
function getExpenseDisplayName(category: string, type: string): string {
  const lowerCategory = category.toLowerCase()

  // Mapping common categories
  const categoryMappings: Record<string, string> = {
    gaji: 'Biaya Gaji Staff',
    salary: 'Biaya Gaji Staff',
    upah: 'Biaya Upah',
    sewa: 'Biaya Sewa',
    rent: 'Biaya Sewa',
    listrik: 'Beban Listrik',
    air: 'Beban Air',
    internet: 'Beban Internet',
    telepon: 'Beban Telepon',
    transport: 'Biaya Transportasi',
    bensin: 'Biaya Transportasi',
    bbm: 'Biaya Bahan Bakar',
    komisi: 'Beban Komisi',
    iklan: 'Beban Iklan',
    marketing: 'Biaya Pemasaran',
    pemasaran: 'Biaya Pemasaran',
    bunga: type === 'ASSET' ? 'Pendapatan Bunga' : 'Beban Bunga',
    penyusutan: 'Beban Penyusutan',
    depresiasi: 'Beban Penyusutan',
    operasional: 'Biaya Operasional',
    alat: 'Biaya Peralatan',
    material: 'Biaya Material',
  }

  for (const [key, value] of Object.entries(categoryMappings)) {
    if (lowerCategory.includes(key)) {
      return value
    }
  }

  // Return original with capitalization
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const year = parseInt(query.year as string) || new Date().getFullYear()
  const period = (query.period as string) || 'month' // month, quarter, year
  const periodValue = query.periodValue ? parseInt(query.periodValue as string) : null

  try {
    // Get company info
    const company = await prisma.company.findFirst()
    const companyName = company?.name || 'OCN CCTV & Networking Solutions'

    // Calculate date range
    let startDate: Date
    let endDate: Date
    let periodLabel: string

    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ]

    if (period === 'month' && periodValue) {
      startDate = new Date(year, periodValue - 1, 1)
      endDate = new Date(year, periodValue, 0, 23, 59, 59, 999)
      periodLabel = `Untuk Periode ${monthNames[periodValue - 1]} ${year}`
    } else if (period === 'quarter' && periodValue) {
      const quarterStartMonth = (periodValue - 1) * 3
      startDate = new Date(year, quarterStartMonth, 1)
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999)
      periodLabel = `Untuk Kuartal ${periodValue} (${monthNames[quarterStartMonth]} - ${monthNames[quarterStartMonth + 2]}) ${year}`
    } else {
      // Full year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      periodLabel = `Untuk Tahun yang Berakhir pada 31 Desember ${year}`
    }

    // Get projects (revenue) in the period
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
        status: {
          in: ['COMPLETED', 'PAID', 'CLOSED', 'ONGOING'],
        },
      },
      include: {
        items: true,
        expenses: true,
      },
    })

    // Get payments received in the period
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        type: {
          in: ['FULL', 'DP', 'INSTALLMENT', 'SETTLEMENT'],
        },
      },
      include: {
        project: true,
      },
    })

    // Filter payments from cancelled projects
    const validPayments = payments.filter(p => !p.project || p.project.status !== 'CANCELLED')

    // Get all expenses in the period
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: true,
      },
    })

    // Filter expenses from cancelled projects
    const validExpenses = expenses.filter(e => !e.project || e.project.status !== 'CANCELLED')

    // Get cash transactions (expenses) in the period - includes PO and other cash expenses
    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'EXPENSE',
      },
    })

    // Calculate revenue (Pendapatan Kotor)
    // Use payments received or project values
    let pendapatanKotor = 0
    if (validPayments.length > 0) {
      pendapatanKotor = validPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    } else {
      pendapatanKotor = projects.reduce((sum, p) => sum + Number(p.finalPrice || p.budget || 0), 0)
    }

    // Diskon Penjualan - sum of discounts from payments
    const diskonPenjualan = validPayments.reduce(
      (sum, p) => sum + Number((p as any).discount || 0),
      0
    )
    const returPenjualan = 0
    const penjualanBersih = pendapatanKotor - diskonPenjualan - returPenjualan

    // Calculate HPP (Cost of Goods Sold) from project items
    let hpp = 0
    const hppDetailItems: Map<string, number> = new Map()

    // Add project items cost to HPP
    let projectItemsCost = 0
    projects.forEach(project => {
      project.items.forEach(item => {
        const cost = Number(item.totalCost || 0)
        hpp += cost
        projectItemsCost += cost
      })
    })
    if (projectItemsCost > 0) {
      hppDetailItems.set('Biaya Material/Produk Project', projectItemsCost)
    }

    // Collect project-type expenses for display AND add to HPP
    const biayaProjectItems: Map<string, number> = new Map()
    validExpenses
      .filter(e => e.type === 'PROJECT')
      .forEach(e => {
        const displayName = getExpenseDisplayName(e.category, e.type)
        const amount = Number(e.amount)
        hpp += amount
        hppDetailItems.set(displayName, (hppDetailItems.get(displayName) || 0) + amount)
        biayaProjectItems.set(displayName, (biayaProjectItems.get(displayName) || 0) + amount)
      })

    // NOTE: PO (Purchase Order) costs are already reflected in project.items.totalCost
    // when items are added from PO to the project. Adding CashTransaction PO here
    // would cause double-counting. PO expenses are tracked separately in the
    // Laporan Pembelian (purchases report).

    // Add other cash transaction expenses to operating expenses (except PO and PAYMENT which are handled differently)
    const otherCashExpenses = cashTransactions.filter(
      ct => !['PO', 'PAYMENT'].includes(ct.category)
    )

    const labaKotor = penjualanBersih - hpp

    // Categorize expenses
    const biayaPenjualanItems: Map<string, number> = new Map()
    const biayaAdministratifItems: Map<string, number> = new Map()
    const pendapatanLainLainItems: Map<string, number> = new Map()

    validExpenses.forEach(expense => {
      if (expense.type === 'PROJECT') return // Already counted in HPP

      const expenseCategory = categorizeExpense(expense.category, expense.type)
      const displayName = getExpenseDisplayName(expense.category, expense.type)
      const amount = Number(expense.amount)

      switch (expenseCategory) {
        case 'penjualan':
          biayaPenjualanItems.set(displayName, (biayaPenjualanItems.get(displayName) || 0) + amount)
          break
        case 'administratif':
          biayaAdministratifItems.set(
            displayName,
            (biayaAdministratifItems.get(displayName) || 0) + amount
          )
          break
        case 'lainlain':
          // For "lainlain", negative means income, positive means expense
          pendapatanLainLainItems.set(
            displayName,
            (pendapatanLainLainItems.get(displayName) || 0) + amount
          )
          break
      }
    })

    // Add salary expenses to administratif
    const salaryExpenses = validExpenses.filter(e => e.type === 'SALARY')
    salaryExpenses.forEach(e => {
      const displayName = 'Biaya Gaji & Fee'
      biayaAdministratifItems.set(
        displayName,
        (biayaAdministratifItems.get(displayName) || 0) + Number(e.amount)
      )
    })

    // Add other cash transaction expenses to administratif
    otherCashExpenses.forEach(ct => {
      const categoryMap: Record<string, string> = {
        ASSET: 'Pembelian Aset',
        SALARY: 'Biaya Gaji & Fee',
        EXPENSE: 'Biaya Operasional',
      }
      const displayName = categoryMap[ct.category] || ct.description || 'Biaya Lainnya'
      biayaAdministratifItems.set(
        displayName,
        (biayaAdministratifItems.get(displayName) || 0) + Number(ct.amount)
      )
    })

    // Convert maps to arrays
    const biayaPenjualan: ExpenseCategory = {
      items: Array.from(biayaPenjualanItems.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: Array.from(biayaPenjualanItems.values()).reduce((sum, v) => sum + v, 0),
    }

    const biayaAdministratif: ExpenseCategory = {
      items: Array.from(biayaAdministratifItems.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: Array.from(biayaAdministratifItems.values()).reduce((sum, v) => sum + v, 0),
    }

    const pendapatanLainLain: ExpenseCategory = {
      items: Array.from(pendapatanLainLainItems.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: Array.from(pendapatanLainLainItems.values()).reduce((sum, v) => sum + v, 0),
    }

    // Create hppDetail category
    const hppDetail: ExpenseCategory = {
      items: Array.from(hppDetailItems.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: hpp,
    }

    // Create biayaProject category (for display in operating expenses)
    const biayaProject: ExpenseCategory = {
      items: Array.from(biayaProjectItems.entries()).map(([name, amount]) => ({
        name,
        amount,
      })),
      total: Array.from(biayaProjectItems.values()).reduce((sum, v) => sum + v, 0),
    }

    // Include biayaProject in total operating expenses
    const totalBiayaOperasional =
      biayaPenjualan.total + biayaAdministratif.total + biayaProject.total
    const pendapatanOperasional = labaKotor - totalBiayaOperasional
    const labaBersih = pendapatanOperasional - pendapatanLainLain.total

    const report: ProfitLossReport = {
      companyName,
      periodLabel,
      data: {
        pendapatanKotor,
        diskonPenjualan,
        returPenjualan,
        penjualanBersih,
        hpp,
        hppDetail,
        labaKotor,
        biayaPenjualan,
        biayaAdministratif,
        biayaProject,
        totalBiayaOperasional,
        pendapatanOperasional,
        pendapatanLainLain,
        labaBersih,
      },
    }

    return report
  } catch (error: any) {
    console.error('Error generating P&L report:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate profit and loss report',
    })
  }
})
