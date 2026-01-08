import { z } from 'zod'

const updateFeeSchema = z.object({
  fee: z.number().min(0),
  feeType: z.enum(['FIXED', 'PERCENTAGE']),
})

export default defineEventHandler(async event => {
  const projectId = getRouterParam(event, 'id')
  const techId = getRouterParam(event, 'techId')
  const body = await readBody(event)

  const validation = updateFeeSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: 'Data tidak valid',
    })
  }

  const { fee, feeType } = validation.data

  // Get project with technicians
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      technicians: {
        include: {
          technician: true,
        },
      },
    },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      message: 'Proyek tidak ditemukan',
    })
  }

  // Check if technician exists in project
  const techExists = project.technicians.find(t => t.id === techId)
  if (!techExists) {
    throw createError({
      statusCode: 404,
      message: 'Teknisi tidak ditemukan di proyek ini',
    })
  }

  // Update technician fee
  const updated = await prisma.projectTechnician.update({
    where: { id: techId },
    data: {
      fee: fee,
      feeType: feeType,
    },
  })

  return updated
})
