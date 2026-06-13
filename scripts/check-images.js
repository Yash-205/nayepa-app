const fs = require('fs');
const path = require('path');

function getJpegSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  let i = 0;
  if (buffer[i] !== 0xFF || buffer[i + 1] !== 0xD8) {
    return null; // Not a JPEG
  }
  i += 2;
  
  while (i < buffer.length) {
    if (buffer[i] !== 0xFF) return null;
    const marker = buffer[i + 1];
    
    // SOF0 (Start of Frame 0) marker is 0xC0
    // SOF2 (Progressive Start of Frame) marker is 0xC2
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buffer[i + 5] * 256 + buffer[i + 6];
      const width = buffer[i + 7] * 256 + buffer[i + 8];
      return { width, height };
    }
    
    // Move to next marker
    const length = buffer[i + 2] * 256 + buffer[i + 3];
    i += 2 + length;
  }
  return null;
}

const assetsDir = path.resolve(__dirname, '../public/assets');
const files = fs.readdirSync(assetsDir);

console.log('--- Image Dimensions ---');
files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (file.endsWith('.jpeg') || file.endsWith('.jpg')) {
    const size = getJpegSize(filePath);
    if (size) {
      const aspect = (size.width / size.height).toFixed(2);
      let type = 'Square/Standard';
      if (aspect > 1.2) type = 'Landscape';
      if (aspect < 0.8) type = 'Portrait';
      console.log(`${file}: ${size.width}x${size.height} (Aspect: ${aspect}, Type: ${type})`);
    } else {
      console.log(`${file}: Unable to read JPEG headers`);
    }
  } else if (file.endsWith('.svg')) {
    console.log(`${file}: SVG Vector Graphic`);
  }
});
