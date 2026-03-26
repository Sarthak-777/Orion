const fs = require('fs');
const path = require('path');

// Minimalist tuning fork SVG (Lawnicon style)
const createIconSvg = (size, padding = 0.2) => {
  const p = size * padding;
  const center = size / 2;
  const strokeWidth = size * 0.06;

  // Tuning fork dimensions
  const forkWidth = size * 0.35;
  const forkHeight = size * 0.45;
  const handleHeight = size * 0.25;
  const prongGap = size * 0.12;

  const topY = p + size * 0.05;
  const forkBottomY = topY + forkHeight;
  const handleBottomY = forkBottomY + handleHeight;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <g stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Left prong -->
    <path d="M ${center - prongGap} ${topY}
             L ${center - prongGap} ${forkBottomY - size * 0.08}
             Q ${center - prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Right prong -->
    <path d="M ${center + prongGap} ${topY}
             L ${center + prongGap} ${forkBottomY - size * 0.08}
             Q ${center + prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Handle -->
    <line x1="${center}" y1="${forkBottomY}" x2="${center}" y2="${handleBottomY}"/>
    <!-- Base circle -->
    <circle cx="${center}" cy="${handleBottomY + size * 0.04}" r="${size * 0.04}"/>
  </g>
</svg>`;
};

// Adaptive icon (just the foreground, transparent background)
const createAdaptiveIconSvg = (size) => {
  const center = size / 2;
  const strokeWidth = size * 0.05;
  const padding = size * 0.28; // More padding for adaptive icons

  const prongGap = size * 0.09;
  const topY = padding;
  const forkBottomY = center + size * 0.05;
  const handleBottomY = size - padding - size * 0.05;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Left prong -->
    <path d="M ${center - prongGap} ${topY}
             L ${center - prongGap} ${forkBottomY - size * 0.06}
             Q ${center - prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Right prong -->
    <path d="M ${center + prongGap} ${topY}
             L ${center + prongGap} ${forkBottomY - size * 0.06}
             Q ${center + prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Handle -->
    <line x1="${center}" y1="${forkBottomY}" x2="${center}" y2="${handleBottomY}"/>
    <!-- Base circle -->
    <circle cx="${center}" cy="${handleBottomY + size * 0.03}" r="${size * 0.03}"/>
  </g>
</svg>`;
};

// Splash icon (larger, centered)
const createSplashSvg = (size) => {
  const center = size / 2;
  const iconSize = size * 0.3;
  const strokeWidth = iconSize * 0.06;

  const prongGap = iconSize * 0.12;
  const topY = center - iconSize * 0.4;
  const forkBottomY = center + iconSize * 0.1;
  const handleBottomY = center + iconSize * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <g stroke="#ffffff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Left prong -->
    <path d="M ${center - prongGap} ${topY}
             L ${center - prongGap} ${forkBottomY - iconSize * 0.08}
             Q ${center - prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Right prong -->
    <path d="M ${center + prongGap} ${topY}
             L ${center + prongGap} ${forkBottomY - iconSize * 0.08}
             Q ${center + prongGap} ${forkBottomY} ${center} ${forkBottomY}"/>
    <!-- Handle -->
    <line x1="${center}" y1="${forkBottomY}" x2="${center}" y2="${handleBottomY}"/>
    <!-- Base circle -->
    <circle cx="${center}" cy="${handleBottomY + iconSize * 0.04}" r="${iconSize * 0.04}"/>
  </g>
</svg>`;
};

const assetsDir = path.join(__dirname, '..', 'assets');

// Generate SVG files
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), createIconSvg(1024));
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), createAdaptiveIconSvg(1024));
fs.writeFileSync(path.join(assetsDir, 'splash-icon.svg'), createSplashSvg(1024));
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), createIconSvg(48));

console.log('SVG icons generated in assets/ folder');
console.log('');
console.log('To convert to PNG, you can use one of these methods:');
console.log('');
console.log('1. Online: https://svgtopng.com/ or https://cloudconvert.com/svg-to-png');
console.log('');
console.log('2. Using sharp (npm install sharp):');
console.log('   node -e "require(\'sharp\')(\'assets/icon.svg\').resize(1024).png().toFile(\'assets/icon.png\')"');
console.log('');
console.log('3. Using Inkscape CLI:');
console.log('   inkscape assets/icon.svg -w 1024 -h 1024 -o assets/icon.png');
console.log('');
console.log('Required sizes:');
console.log('  - icon.png: 1024x1024');
console.log('  - adaptive-icon.png: 1024x1024');
console.log('  - splash-icon.png: 1024x1024');
console.log('  - favicon.png: 48x48');
