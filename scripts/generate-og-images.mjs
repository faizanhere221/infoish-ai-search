// One-off script to generate public/og-image.jpg and public/twitter-image.jpg.
// Run: node scripts/generate-og-images.mjs
import sharp from 'sharp'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const logoBuffer = readFileSync(path.join(root, 'public', 'logo.png'))
const logoBase64 = logoBuffer.toString('base64')

function buildSvg(width, height) {
  const logoSize = 160
  const logoX = (width - logoSize) / 2
  const logoY = height / 2 - logoSize - 20

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#de5688" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#1A1A2E" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#de5688" />
      <stop offset="100%" stop-color="#b153c8" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#1A1A2E" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />
  <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="data:image/png;base64,${logoBase64}" />
  <text x="50%" y="${height / 2 + 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff">Infoishai</text>
  <text x="50%" y="${height / 2 + 120}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="500" fill="url(#text-grad)">Free Tech Influencer Marketplace</text>
</svg>`
}

async function run() {
  await sharp(Buffer.from(buildSvg(1200, 630)))
    .jpeg({ quality: 90 })
    .toFile(path.join(root, 'public', 'og-image.jpg'))
  console.log('Wrote public/og-image.jpg (1200x630)')

  await sharp(Buffer.from(buildSvg(1200, 600)))
    .jpeg({ quality: 90 })
    .toFile(path.join(root, 'public', 'twitter-image.jpg'))
  console.log('Wrote public/twitter-image.jpg (1200x600)')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
