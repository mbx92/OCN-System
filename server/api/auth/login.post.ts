import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username dan password harus diisi',
    })
  }

  // Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: username }, { username: username }],
    },
    include: {
      technicianProfile: true,
    },
  })

  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Username atau password salah',
    })
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Username atau password salah',
    })
  }

  // Get runtime config for JWT secret
  const config = useRuntimeConfig()
  const jwtSecret = config.jwtSecret

  // Generate token
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      technicianId: user.technicianProfile?.id,
    },
    jwtSecret,
    { expiresIn: '7d' }
  )

  // Create session
  const headers = getHeaders(event)
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      userAgent: headers['user-agent'] || null,
      ipAddress: getRequestIP(event) || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: getRequestIP(event) || null,
    },
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      technicianId: user.technicianProfile?.id,
    },
    token,
  }
})
