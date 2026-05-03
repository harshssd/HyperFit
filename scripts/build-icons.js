/* eslint-disable */
// Build app icon variants from SVG masters.
// Run: node scripts/build-icons.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BRAND = path.join(__dirname, '..', 'assets', 'brand');
const ASSETS = path.join(__dirname, '..', 'assets');

const masterFull = fs.readFileSync(path.join(BRAND, 'icon.svg'));
const masterFg = fs.readFileSync(path.join(BRAND, 'icon-foreground.svg'));

async function render(svg, size, out, opts = {}) {
  const pipeline = sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain' });
  if (opts.flatten) {
    await pipeline.flatten({ background: opts.background || '#0a0a0a' }).png().toFile(out);
  } else {
    await pipeline.png().toFile(out);
  }
  console.log(`  ${path.relative(path.join(__dirname, '..'), out)}  ${size}x${size}`);
}

async function main() {
  console.log('Rendering icons:');
  // iOS app icon — full bleed, baked background, 1024x1024 master
  await render(masterFull, 1024, path.join(ASSETS, 'icon.png'), { flatten: true });
  // Android adaptive foreground — transparent, subject in safe area
  await render(masterFg, 1024, path.join(ASSETS, 'adaptive-icon.png'));
  // Splash icon — transparent, app.json splash.backgroundColor handles fill
  await render(masterFg, 1024, path.join(ASSETS, 'splash-icon.png'));
  // Web favicon
  await render(masterFull, 256, path.join(ASSETS, 'favicon.png'), { flatten: true });
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
