(async () => {
  const pngToIco = (await import('png-to-ico')).default;
  const sharp = require('sharp');
  const fs = require('fs');
  const path = require('path');

  const DEFAULT_INPUT = 'E:\\cj_optimizer_icon_transparent.png';
  const input = process.argv[2] || DEFAULT_INPUT;
  const output = path.join(__dirname, '..', 'assets', 'icon.ico');
  const outputPng = path.join(__dirname, '..', 'assets', 'icon.png');

  if (!fs.existsSync(input)) {
    console.error('Input PNG not found:', input);
    process.exit(1);
  }

  try {
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const pngBuffers = [];
    for (const size of sizes) {
      const buf = await sharp(input).resize(size, size).png().toBuffer();
      pngBuffers.push(buf);
    }
    const ico = await pngToIco(pngBuffers);
    fs.writeFileSync(output, ico);
    fs.writeFileSync(outputPng, pngBuffers[sizes.indexOf(256)]);
    console.log('Icon created:', output, 'Size:', ico.length, `(${sizes.join('/')}px)`);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();