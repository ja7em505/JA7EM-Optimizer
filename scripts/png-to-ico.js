(async () => {
  const pngToIco = (await import('png-to-ico')).default;
  const fs = require('fs');
  const path = require('path');
  const input = 'F:\\T.png';
  const output = path.join(__dirname, '..', 'assets', 'icon.ico');
  try {
    const buf = await pngToIco([input]);
    fs.writeFileSync(output, buf);
    console.log('Icon created:', output, 'Size:', buf.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
