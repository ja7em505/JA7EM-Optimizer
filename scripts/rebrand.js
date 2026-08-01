const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const replacements = [
  [/CJ Optimizer/g, 'CJ Optimizer'],
  [/CJ-Optimizer/g, 'CJ-Optimizer'],
  [/cj-optimizer/g, 'cj-optimizer'],
  [/CJ_OPTIMIZER/g, 'CJ_OPTIMIZER'],
  [/CJ_AUTHENTIC/g, 'CJ_AUTHENTIC'],
  [/BY_CJ_ONLY/g, 'BY_CJ_ONLY'],
  ['JA7EM-OPTIMIZER-2024-SECURE-KEY', '__KEEP_ENCRYPTION_KEY__'],
  [/CJ-([A-Za-z])/g, 'CJ-$1'],
  [/CJ/g, 'CJ'],
  ['__KEEP_ENCRYPTION_KEY__', 'CJ-OPTIMIZER-2024-SECURE-KEY'],
  [/'CJ-'/g, "'CJ-'"],
  [/'CJ'/g, "'CJ'"],
  [/"CJ"/g, '"CJ"'],
  [/com\.ja7em\.optimizer/g, 'com.cjteam.optimizer'],
  [/cj_license/g, 'cj_license'],
  [/cj_/g, 'cj_'],
];

function needsRebrand(filePath) {
  const ext = path.extname(filePath);
  if (['.js', '.html', '.css', '.json', '.md', '.yml'].includes(ext)) return true;
  return false;
}

function rebrandFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [from, to] of replacements) {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        changed = true;
        content = newContent;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('OK: ' + path.relative(ROOT, filePath));
    }
  } catch (e) {
    console.error('ERR: ' + filePath + ' - ' + e.message);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      walkDir(fullPath);
    } else if (needsRebrand(fullPath)) {
      rebrandFile(fullPath);
    }
  }
}

console.log('[REBRAND] Starting...');
walkDir(ROOT);
console.log('[REBRAND] Done');
