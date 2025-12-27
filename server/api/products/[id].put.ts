import { z } from 'zod'

const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['PRODUCT', 'SERVICE', 'MATERIAL']).default('PRODUCT'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  unit: z.string().optional().nullable(),
  purchaseUnit: z.string().optional().nullable(),
  conversionFactor: z.number().min(1).default(1),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID tidak valid',
    })
  }

  const existing = await prisma.product.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Produk tidak ditemukan',
    })
  }

  const result = updateProductSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  // Check if new SKU conflicts with another product
  if (data.sku !== existing.sku) {
    const skuConflict = await prisma.product.findUnique({
      where: { sku: data.sku },
    })
    if (skuConflict) {
      throw createError({
        statusCode: 400,
        statusMessage: 'SKU sudah digunakan produk lain',
      })
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      type: data.type,
      category: data.category,
      unit: data.unit || null,
      purchaseUnit: data.purchaseUnit || null,
      conversionFactor: data.conversionFactor,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      minStock: data.minStock,
    },
  })

  return product
})
