import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  companyName: z.string().optional().nullable(),
  phone: z.string().min(1, 'Nomor telepon harus diisi'),
  email: z.string().email('Email tidak valid').optional().nullable().or(z.literal('')),
  address: z.string().min(1, 'Alamat harus diisi'),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID pelanggan tidak ditemukan',
    })
  }

  const result = customerSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.errors[0].message,
    })
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: result.data.name,
      companyName: result.data.companyName || null,
      phone: result.data.phone,
      email: result.data.email || null,
      address: result.data.address,
      notes: result.data.notes || null,
    },
  })

  return customer
})
