import { z } from 'zod'

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nama supplier wajib diisi'),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = createSupplierSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const supplier = await prisma.supplier.create({
    data: {
      name: result.data.name,
      contactPerson: result.data.contactPerson || null,
      phone: result.data.phone,
      email: result.data.email || null,
      address: result.data.address || null,
    },
  })

  return supplier
})
