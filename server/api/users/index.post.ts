import bcrypt from 'bcrypt'
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['OWNER', 'ADMIN', 'TECHNICIAN', 'VIEWER']),
  phone: z.string().nullable().optional(),
})

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const data = createUserSchema.parse(body)

  // Check if username or email already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username atau email sudah digunakan',
    })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      phone: data.phone || null,
    },
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
