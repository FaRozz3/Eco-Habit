const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

function drawLeaf(ctx, cx, cy, size) {
  // Leaf shape: teardrop/leaf using bezier curves
  ctx.beginPath();
  // Start at bottom-left
  ctx.moveTo(cx - size * 0.05, cy + size * 0.4);
  // Left curve up to top
  ctx.bezierCurveTo(
    cx - size * 0.45, cy + size * 0.1,
    cx - size * 0.35, cy - size * 0.35,
    cx + size * 0.05, cy - size * 0.42
  );
  // Right curve down to bottom
  ctx.bezierCurveTo(
    cx + size * 0.4, cy - size * 0.2,
    cx + size * 0.4, cy + size * 0.2,
    cx - size * 0.05, cy + size * 0.4
  );
  ctx.closePath();
  ctx.fillStyle = '#00f59f';
  ctx.fill();

  // Leaf vein (center line)
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.02, cy + size * 0.3);
  ctx.quadraticCurveTo(cx + size * 0.05, cy, cx + size * 0.02, cy - size * 0.3);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Main icon (1024x1024) - dark bg with leaf
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#0F1115';
  ctx.fillRect(0, 0, size, size);

  // Subtle circular glow
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.45);
  gradient.addColorStop(0, 'rgba(120, 160, 180, 0.15)');
  gradient.addColorStop(1, 'rgba(120, 160, 180, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Leaf
  drawLeaf(ctx, size/2, size/2, size * 0.5);

  // Leaf glow
  const leafGlow = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.25);
  leafGlow.addColorStop(0, 'rgba(0, 245, 159, 0.2)');
  leafGlow.addColorStop(1, 'rgba(0, 245, 159, 0)');
  ctx.fillStyle = leafGlow;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Android adaptive foreground (transparent bg, just the leaf)
function generateForeground(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background (adaptive icon has separate bg)
  ctx.clearRect(0, 0, size, size);

  // Leaf centered (adaptive icons need content in safe zone ~66%)
  drawLeaf(ctx, size/2, size/2, size * 0.35);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Android adaptive background (dark solid)
function generateBackground(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0F1115';
  ctx.fillRect(0, 0, size, size);

  // Subtle glow
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.5);
  gradient.addColorStop(0, 'rgba(120, 160, 180, 0.12)');
  gradient.addColorStop(1, 'rgba(15, 17, 21, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Monochrome (white leaf on transparent)
function generateMonochrome(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // White leaf for monochrome
  ctx.beginPath();
  const cx = size/2, cy = size/2, s = size * 0.35;
  ctx.moveTo(cx - s * 0.05, cy + s * 0.4);
  ctx.bezierCurveTo(cx - s * 0.45, cy + s * 0.1, cx - s * 0.35, cy - s * 0.35, cx + s * 0.05, cy - s * 0.42);
  ctx.bezierCurveTo(cx + s * 0.4, cy - s * 0.2, cx + s * 0.4, cy + s * 0.2, cx - s * 0.05, cy + s * 0.4);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Favicon (small, 48x48)
function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0F1115';
  ctx.fillRect(0, 0, size, size);
  drawLeaf(ctx, size/2, size/2, size * 0.5);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Splash icon
function generateSplash(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent bg
  ctx.clearRect(0, 0, size, size);
  drawLeaf(ctx, size/2, size/2, size * 0.4);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(ASSETS, filename), buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate all icons
generateIcon(1024, 'icon.png');
generateForeground(1024, 'android-icon-foreground.png');
generateBackground(1024, 'android-icon-background.png');
generateMonochrome(1024, 'android-icon-monochrome.png');
generateFavicon(48, 'favicon.png');
generateSplash(512, 'splash-icon.png');

console.log('\nAll icons generated!');
