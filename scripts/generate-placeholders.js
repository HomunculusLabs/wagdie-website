const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'public', 'images');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const placeholders = [
  {
    name: 'community-1.png',
    width: 800,
    height: 600,
    color: { r: 99, g: 102, b: 241 }, // Indigo
    text: 'Community 1'
  },
  {
    name: 'community-2.png',
    width: 800,
    height: 600,
    color: { r: 168, g: 85, b: 247 }, // Purple
    text: 'Community 2'
  },
  {
    name: 'community-3.png',
    width: 800,
    height: 600,
    color: { r: 236, g: 72, b: 153 }, // Pink
    text: 'Community 3'
  },
  {
    name: 'cta-discord.png',
    width: 400,
    height: 300,
    color: { r: 88, g: 101, b: 242 }, // Discord Blue
    text: 'Join Discord'
  },
  {
    name: 'cta-characters.png',
    width: 400,
    height: 300,
    color: { r: 16, g: 185, b: 129 }, // Emerald
    text: 'View Characters'
  },
  {
    name: 'og-image.png',
    width: 1200,
    height: 630,
    color: { r: 15, g: 23, b: 42 }, // Slate dark
    text: 'WAGDIE'
  }
];

async function createPlaceholder(config) {
  const { name, width, height, color, text } = config;
  const outputPath = path.join(imagesDir, name);

  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="rgb(${color.r},${color.g},${color.b})" />
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${width > 800 ? '48' : '32'}"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${text}
      </text>
      <text
        x="50%"
        y="${height - 30}"
        font-family="Arial, sans-serif"
        font-size="14"
        fill="rgba(255,255,255,0.7)"
        text-anchor="middle"
      >
        ${width}x${height} Placeholder
      </text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    console.log(`✓ Created: ${name}`);
  } catch (error) {
    console.error(`✗ Failed to create ${name}:`, error.message);
  }
}

async function generateAll() {
  console.log('Generating placeholder images...\n');
  for (const config of placeholders) {
    await createPlaceholder(config);
  }
  console.log('\n✓ All placeholders generated!');
}

generateAll().catch(console.error);
