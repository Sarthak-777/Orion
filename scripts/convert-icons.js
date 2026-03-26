const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

async function convertIcons() {
  console.log('Converting SVG icons to PNG...\n');

  try {
    // Icon (1024x1024)
    await sharp(path.join(assetsDir, 'icon.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ icon.png (1024x1024)');

    // Adaptive icon (1024x1024)
    await sharp(path.join(assetsDir, 'adaptive-icon.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ adaptive-icon.png (1024x1024)');

    // Splash icon (1024x1024)
    await sharp(path.join(assetsDir, 'splash-icon.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'splash-icon.png'));
    console.log('✓ splash-icon.png (1024x1024)');

    // Favicon (48x48)
    await sharp(path.join(assetsDir, 'favicon.svg'))
      .resize(48, 48)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ favicon.png (48x48)');

    console.log('\nAll icons converted successfully!');
  } catch (error) {
    console.error('Error converting icons:', error);
  }
}

convertIcons();
