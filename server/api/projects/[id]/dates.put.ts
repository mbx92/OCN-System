import { z } from 'zod'

const datesSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const user = event.context.user

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID proyek tidak ditemukan',
    })
  }

  const result = datesSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const project = await prisma.project.findUnique({
    where: { id },
  })

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Proyek tidak ditemukan',
    })
  }

  // Check if user is trying to update timestamps (createdAt/updatedAt)
  const isUpdatingTimestamps =
    result.data.createdAt !== undefined || result.data.updatedAt !== undefined

  // Only OWNER can update createdAt and updatedAt
  if (isUpdatingTimestamps && user?.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Hanya OWNER yang dapat mengubah tanggal sistem (Dibuat/Diupdate)',
    })
  }

  const updateData: any = {}

  if (result.data.startDate !== undefined) {
    updateData.startDate = result.data.startDate ? new Date(result.data.startDate) : null
  }

  if (result.data.endDate !== undefined) {
    updateData.endDate = result.data.endDate ? new Date(result.data.endDate) : null
  }

  // OWNER-only: createdAt and updatedAt
  if (result.data.createdAt !== undefined && user?.role === 'OWNER') {
    updateData.createdAt = new Date(result.data.createdAt)
  }

  if (result.data.updatedAt !== undefined && user?.role === 'OWNER') {
    updateData.updatedAt = new Date(result.data.updatedAt)
  }

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
  })

  return updated
})
