/* eslint-disable */
// Build app icon variants from the master PNG (assets/brand/icon-master.png).
// Run: node scripts/build-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND = path.join(__dirname, '..', 'assets', 'brand');
const ASSETS = path.join(__dirname, '..', 'assets');

const masterPng = path.join(BRAND, 'icon-master.png');
const BG = '#0a0a0a';

async function renderFull(size, out) {
  await sharp(masterPng)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: BG })
    .png()
    .toFile(out);
  console.log(`  ${path.relative(path.join(__dirname, '..'), out)}  ${size}x${size}`);
}

async function renderForeground(size, out) {
  // Android adaptive foreground: subject occupies inner 66% of canvas,
  // outer 33% is transparent safe-zone padding the launcher may mask.
  const inner = Math.round(size * 0.66);
  const inset = Math.round((size - inner) / 2);
  const subject = await sharp(masterPng)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: subject, top: inset, left: inset }])
    .png()
    .toFile(out);
  console.log(`  ${path.relative(path.join(__dirname, '..'), out)}  ${size}x${size}`);
}

async function main() {
  if (!fs.existsSync(masterPng)) {
    console.error(`Missing master: ${masterPng}`);
    process.exit(1);
  }
  console.log('Rendering icons:');
  // iOS app icon — full bleed, baked anthracite background
  await renderFull(1024, path.join(ASSETS, 'icon.png'));
  // Android adaptive foreground — transparent, subject in 66% safe area
  await renderForeground(1024, path.join(ASSETS, 'adaptive-icon.png'));
  // Splash icon — same foreground; app.json splash.backgroundColor fills
  await renderForeground(1024, path.join(ASSETS, 'splash-icon.png'));
  // Web favicon
  await renderFull(256, path.join(ASSETS, 'favicon.png'));
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
