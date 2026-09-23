const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// JPEG files to convert to WebP
const jpegFiles = [
  'logo-wordmark.jpg',
  'logo-full.jpg',
  'logo-icon.jpg',
  'logo-sparkle.jpg'
];

async function convertToWebP(filename) {
  const inputPath = path.join(IMAGES_DIR, filename);
  const outputName = filename.replace('.jpg', '.webp');
  const outputPath = path.join(IMAGES_DIR, outputName);

  if (!fs.existsSync(inputPath)) {
    console.log(`??  Skipping: ${filename} (not found)`);
    return;
  }

  try {
    await sharp(inputPath)
      .webp({
        quality: 85,
        effort: 6,
        smartSubsample: true,
        reductionEffort: 6
      })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`? ${filename} ? ${outputName}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`   WebP: ${(newSize / 1024).toFixed(1)} KB`);
    console.log(`   Savings: ${savings}%`);
  } catch (error) {
    console.error(`? Error converting ${filename}:`, error.message);
  }
}

async function generateResponsiveSizes(filename) {
  const inputPath = path.join(IMAGES_DIR, filename);
  const baseName = filename.replace('.jpg', '');

  if (!fs.existsSync(inputPath)) {
    return;
  }

  const sizes = [640, 1080, 1920];

  for (const width of sizes) {
    const outputName = `${baseName}-${width}.webp`;
    const outputPath = path.join(IMAGES_DIR, outputName);

    try {
      await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
      console.log(`   ?? Generated ${outputName}`);
    } catch (error) {
      console.error(`   ? Error generating ${outputName}:`, error.message);
    }
  }
}

async function main() {
  console.log('?? Starting image optimization...\n');

  for (const file of jpegFiles) {
    await convertToWebP(file);
    await generateResponsiveSizes(file);
    console.log('');
  }

  console.log('\n? Optimization complete!');
  console.log('\nNext steps:');
  console.log('1. Verify the WebP files were created');
  console.log('2. Update references in your code to use WebP with JPEG fallback');
  console.log('3. Keep original JPEG files as fallbacks for older browsers');
}

main().catch(console.error);
