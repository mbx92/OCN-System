import bcrypt from 'bcrypt'

export default defineEventHandler(async event => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Tidak terautentikasi',
    })
  }

  const body = await readBody(event)
  const { oldPassword, newPassword } = body

  if (!oldPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'Password lama dan baru harus diisi',
    })
  }

  if (newPassword.length < 6) {
    throw createError({
      statusCode: 400,
      message: 'Password baru minimal 6 karakter',
    })
  }

  // Get current user with password
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!currentUser) {
    throw createError({
      statusCode: 404,
      message: 'User tidak ditemukan',
    })
  }

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, currentUser.password)

  if (!isValid) {
    throw createError({
      statusCode: 400,
      message: 'Password lama tidak sesuai',
    })
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  return {
    success: true,
    message: 'Password berhasil diubah',
  }
})
