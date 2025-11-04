const fs = require('fs');
const sharp = require('sharp');

const sizes = [192, 512];

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0A0A0F"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#10B981"/>
      <text x="50%" y="50%" 
            font-family="Arial" 
            font-size="${size/3}" 
            font-weight="bold" 
            fill="white" 
            text-anchor="middle" 
            dominant-baseline="central">TH</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/pwa-${size}x${size}.png`);
  
  console.log(`Created pwa-${size}x${size}.png`);
}

(async () => {
  for (const size of sizes) {
    await generateIcon(size);
  }
  console.log('All icons generated!');
})();
