import { z } from 'zod'

const assignSchema = z.object({
  technicianId: z.string().min(1, 'Teknisi wajib dipilih'),
  fee: z.number().min(0, 'Fee tidak boleh negatif'),
  feeType: z.string().default('PERCENTAGE'),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const result = assignSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { technicianId, fee, feeType } = result.data

  // Check if already assigned
  const existing = await prisma.projectTechnician.findFirst({
    where: {
      projectId: id,
      technicianId,
    },
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Teknisi sudah ditugaskan di proyek ini',
    })
  }

  const assignment = await prisma.projectTechnician.create({
    data: {
      projectId: id,
      technicianId,
      fee,
      feeType,
    },
    include: {
      technician: true,
    },
  })

  return assignment
})
