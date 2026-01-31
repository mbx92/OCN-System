import { defineEventHandler, getQuery } from 'h3'

interface CatalogProduct {
  id: string
  sku: string
  name: string
  category: string
  brand?: string
  unit: string
  price: number
  purchasePrice?: number
  description?: string
  image?: string
  source: 'database' | 'supplier'
  inStock?: boolean
  stockQuantity?: number
}

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const search = (query.search as string)?.toLowerCase() || ''
  const category = (query.category as string)?.toLowerCase() || ''
  const source = (query.source as string) || 'all' // 'all', 'database', 'supplier'
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50

  try {
    const products: CatalogProduct[] = []
    const categories: string[] = []

    // Fetch from database
    if (source === 'all' || source === 'database') {
      const dbProducts = await prisma.product.findMany({
        where: {
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { category: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
            category ? { category: { contains: category, mode: 'insensitive' } } : {},
          ],
        },
        include: {
          stock: true,
        },
        orderBy: { name: 'asc' },
      })

      for (const p of dbProducts) {
        products.push({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit || 'pcs',
          price: Number(p.sellingPrice),
          purchasePrice: Number(p.purchasePrice),
          source: 'database',
          inStock: (p.stock?.available || 0) > 0,
          stockQuantity: p.stock?.available || 0,
        })
      }

      // Get categories from database
      const dbCategories = await prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      })
      categories.push(...dbCategories.map(c => c.category))
    }

    // Fetch from supplier (Google Sheets)
    if (source === 'all' || source === 'supplier') {
      try {
        const baseUrl = process.env.NUXT_PUBLIC_API_BASE || ''
        const supplierResponse = await $fetch<any>('/api/catalog/supplier', {
          query: { search, category, limit: 1000 }, // Fetch all for merging
        })

        if (supplierResponse.success && supplierResponse.data) {
          for (const p of supplierResponse.data) {
            products.push({
              id: `supplier-${p.sku}`,
              sku: p.sku,
              name: p.name,
              category: p.category,
              brand: p.brand,
              unit: p.unit,
              price: p.price,
              description: p.description,
              image: p.image,
              source: 'supplier',
            })
          }

          // Add supplier categories
          if (supplierResponse.categories) {
            categories.push(...supplierResponse.categories)
          }
        }
      } catch (error) {
        console.error('Error fetching supplier catalog:', error)
      }
    }

    // Remove duplicate categories and sort
    const uniqueCategories = [...new Set(categories)].filter(Boolean).sort()

    // Sort products by name
    products.sort((a, b) => a.name.localeCompare(b.name))

    // Pagination
    const total = products.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedProducts = products.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedProducts,
      categories: uniqueCategories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error('Combined catalog error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch catalog',
      data: [],
    }
  }
})
