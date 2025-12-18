import { z } from 'zod'

const updateTechnicianSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  type: z.enum(['FREELANCE', 'INTERNAL']).default('FREELANCE'),
  feeType: z.enum(['PERCENTAGE', 'FIXED', 'CUSTOM']).default('PERCENTAGE'),
  feePercentage: z.number().min(0).max(100).optional().nullable(),
  minFee: z.number().min(0).default(150000),
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

  const existing = await prisma.technician.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Teknisi tidak ditemukan',
    })
  }

  const result = updateTechnicianSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  const technician = await prisma.technician.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      type: data.type,
      feeType: data.feeType,
      feePercentage: data.feePercentage || null,
      minFee: data.minFee,
    },
  })

  return technician
})
