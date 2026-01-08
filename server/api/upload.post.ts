// POST /api/upload - Handle file uploads
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async event => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded',
    })
  }

  const file = formData.find(f => f.name === 'file')

  if (!file || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file found',
    })
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!file.type || !allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only image files are allowed (JPEG, PNG, WebP, GIF)',
    })
  }

  // Max file size 5MB
  const maxSize = 5 * 1024 * 1024
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File size must be less than 5MB',
    })
  }

  // Create unique filename
  const ext = file.filename?.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

  // Ensure upload directory exists
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'credentials')
  await mkdir(uploadDir, { recursive: true })

  // Save file
  const filepath = join(uploadDir, filename)
  const writeStream = createWriteStream(filepath)
  writeStream.write(file.data)
  writeStream.end()

  // Return public URL
  const url = `/uploads/credentials/${filename}`

  return { url, filename }
})
