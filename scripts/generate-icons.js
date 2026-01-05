import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceImage = path.join(__dirname, '../public/logo.png')
const publicDir = path.join(__dirname, '../public')

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

async function generateIcons() {
  console.log('🎨 Generating PWA icons...')

  if (!fs.existsSync(sourceImage)) {
    console.error('❌ Logo not found:', sourceImage)
    process.exit(1)
  }

  for (const { size, name } of sizes) {
    try {
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toFile(path.join(publicDir, name))
      console.log(`✅ Generated ${name} (${size}x${size})`)
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message)
    }
  }

  // Generate favicon.ico (16x16 and 32x32)
  try {
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toFormat('png')
      .toFile(path.join(publicDir, 'favicon-32x32.png'))

    console.log('✅ Generated favicon-32x32.png')
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message)
  }

  console.log('🎉 Icon generation complete!')
}

generateIcons()
