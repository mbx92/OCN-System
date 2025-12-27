import { z } from 'zod'

const createProductSchema = z.object({
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
  const body = await readBody(event)

  const result = createProductSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  // Check if SKU already exists
  const existing = await prisma.product.findUnique({
    where: { sku: data.sku },
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'SKU sudah digunakan',
    })
  }

  const product = await prisma.product.create({
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
