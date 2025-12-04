const fs = require('fs');
const path = require('path');

// Simple script to remind about icon conversion
console.log('==================================================');
console.log('Icon Conversion Required');
console.log('==================================================');
console.log('');
console.log('To use icon.svg as the application icon:');
console.log('');
console.log('1. Convert icon.svg to icon.png (256x256 or 512x512) using:');
console.log('   - Online tool: https://cloudconvert.com/svg-to-png');
console.log('   - Or Inkscape: inkscape -w 256 -h 256 icon.svg -o icon.png');
console.log('');
console.log('2. Convert icon.png to icon.ico using:');
console.log('   - Online tool: https://cloudconvert.com/png-to-ico');
console.log('   - Or ImageMagick: convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
console.log('');
console.log('3. Place icon.ico in the public/ directory');
console.log('');
console.log('Or you can install electron-icon-builder:');
console.log('   npm install --save-dev electron-icon-builder');
console.log('   npx electron-icon-builder --input=public/icon.svg --output=public/');
console.log('');
console.log('==================================================');

// Check if icon files exist
const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'icon.svg');
const icoPath = path.join(publicDir, 'icon.ico');
const pngPath = path.join(publicDir, 'icon.png');

if (fs.existsSync(svgPath)) {
    console.log('✓ icon.svg found');
} else {
    console.log('✗ icon.svg not found');
}

if (fs.existsSync(icoPath)) {
    console.log('✓ icon.ico found - Ready to build!');
} else {
    console.log('✗ icon.ico not found - Conversion needed');
}

if (fs.existsSync(pngPath)) {
    console.log('✓ icon.png found');
} else {
    console.log('✗ icon.png not found');
}

console.log('==================================================');
