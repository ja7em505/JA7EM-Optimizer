const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const FILES_TO_OBFUSCATE = [
  'src/main/license-manager.js',
  'src/main/integrity.js',
  'src/main/protection.js'
];

const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

function obfuscateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    const result = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_OPTIONS);
    const obfuscatedCode = result.getObfuscatedCode();
    fs.writeFileSync(fullPath, obfuscatedCode);
    console.log(`[OBFUSC] Obfuscated: ${filePath}`);
    return true;
  } catch (e) {
    console.error(`[OBFUSC] Error obfuscating ${filePath}:`, e.message);
    return false;
  }
}

function obfuscateAll() {
  console.log('[OBFUSC] Starting obfuscation...');
  let success = 0;
  for (const file of FILES_TO_OBFUSCATE) {
    if (obfuscateFile(file)) success++;
  }
  console.log(`[OBFUSC] Done: ${success}/${FILES_TO_OBFUSCATE.length} files obfuscated`);
  return success === FILES_TO_OBFUSCATE.length;
}

module.exports = { obfuscateAll, obfuscateFile };
