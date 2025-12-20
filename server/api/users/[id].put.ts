import bcrypt from 'bcrypt'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'TECHNICIAN', 'VIEWER']).optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak ditemukan' })
  }

  const body = await readBody(event)
  const data = updateUserSchema.parse(body)

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan' })
  }

  // Check if username or email already used by another user
  if (data.username || data.email) {
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [
          data.username ? { username: data.username } : {},
          data.email ? { email: data.email } : {},
        ].filter(o => Object.keys(o).length > 0),
      },
    })
    if (duplicate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username atau email sudah digunakan',
      })
    }
  }

  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.username) updateData.username = data.username
  if (data.email) updateData.email = data.email
  if (data.role) updateData.role = data.role
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
    },
  })

  return user
})
