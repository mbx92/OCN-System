import jwt from 'jsonwebtoken'

export default defineEventHandler(async event => {
  // Skip auth for public routes
  const publicPaths = ['/api/auth/login', '/api/auth/logout']
  const path = getRequestPath(event)

  if (publicPaths.includes(path)) {
    return
  }

  // Skip for non-API routes
  if (!path.startsWith('/api/')) {
    return
  }

  const token =
    getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const config = useRuntimeConfig()

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string; role: string }

    // Check session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired',
      })
    }

    // Attach user to context
    event.context.user = session.user
    event.context.session = session
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }
    throw error
  }
})
