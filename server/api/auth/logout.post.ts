export default defineEventHandler(async event => {
  const token =
    getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (token) {
    // Delete session
    await prisma.session.deleteMany({
      where: { token },
    })
  }

  // Clear cookie
  deleteCookie(event, 'auth-token')

  return { success: true }
})
