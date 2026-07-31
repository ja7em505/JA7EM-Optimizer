const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROTECTED_FILES = [
  'src/main/main.js',
  'src/main/license-manager.js',
  'src/main/integrity.js',
  'src/main/protection.js',
  'src/preload/preload.js',
  'src/renderer/index.html',
  'src/renderer/renderer.js'
];

const ROOT = path.join(__dirname, '..');

function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) { return null; }
}

function calculateCombinedHash() {
  const parts = [];
  for (const file of PROTECTED_FILES) {
    const hash = hashFile(path.join(ROOT, file));
    if (!hash) {
      console.error('[INTEG] Missing or unreadable file:', file);
      return null;
    }
    parts.push(hash);
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function generate() {
  const hash = calculateCombinedHash();
  if (!hash) {
    console.error('[INTEG] Failed to compute integrity hash');
    process.exit(1);
  }
  const output = path.join(ROOT, 'src/main/integrity-expected.js');
  fs.writeFileSync(output, 'module.exports = ' + JSON.stringify(hash) + ';\n');
  console.log('[INTEG] Expected hash written to', output, '->', hash);
  return hash;
}

if (require.main === module) generate();

module.exports = { generate };
