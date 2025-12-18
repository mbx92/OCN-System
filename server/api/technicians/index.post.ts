import { z } from 'zod'

const createTechnicianSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  type: z.enum(['FREELANCE', 'INTERNAL']).default('FREELANCE'),
  feeType: z.enum(['PERCENTAGE', 'FIXED', 'CUSTOM']).default('PERCENTAGE'),
  feePercentage: z.number().min(0).max(100).optional(),
  minFee: z.number().min(0).default(150000),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const result = createTechnicianSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = result.data

  const technician = await prisma.technician.create({
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
