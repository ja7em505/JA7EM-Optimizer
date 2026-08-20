const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');

const expectedHash = require('./integrity-expected');

const PROTECTED_FILES = [
  'src/main/main.js',
  'src/main/license-manager.js',
  'src/main/integrity.js',
  'src/main/protection.js',
  'src/preload/preload.js',
  'src/renderer/index.html',
  'src/renderer/renderer.js'
];

const CORE_FILES = [
  'src/main/license-manager.js',
  'src/main/integrity.js',
  'src/main/protection.js',
  'src/preload/preload.js',
  'src/renderer/index.html',
  'src/renderer/renderer.js'
];

const HIDDEN_WATERMARKS = ['JA7EM_AUTHENTIC', 'LICENSED_SOFTWARE', 'INTEGRITY_CHECK'];

function getAppRoot() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'app.asar');
  return path.join(__dirname, '..', '..');
}

function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) { return null; }
}

function calculateCombinedHash() {
  const root = getAppRoot();
  const parts = [];
  for (const file of PROTECTED_FILES) {
    const hash = calculateFileHash(path.join(root, file));
    if (!hash) return null;
    parts.push(hash);
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function getCurrentHash() {
  return calculateCombinedHash();
}

function calculateCoreHash() {
  const root = getAppRoot();
  const parts = [];
  for (const file of CORE_FILES) {
    const hash = calculateFileHash(path.join(root, file));
    if (!hash) return null;
    parts.push(hash);
  }
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function getCoreHash() {
  return calculateCoreHash();
}

function verifyIntegrity() {
  try {
    const currentHash = calculateCombinedHash();
    if (!currentHash) return { valid: false, reason: 'missing_file' };
    if (currentHash !== expectedHash) return { valid: false, reason: 'file_modified' };
    return { valid: true };
  } catch (e) { return { valid: false, reason: 'error' }; }
}

function checkWatermarks() {
  try {
    const root = getAppRoot();
    const mainFile = path.join(root, 'src/main/main.js');
    if (!fs.existsSync(mainFile)) return { valid: false };
    const content = fs.readFileSync(mainFile, 'utf8');
    let found = 0;
    for (const wm of HIDDEN_WATERMARKS) { if (content.includes(wm)) found++; }
    return { valid: found >= 2, found, total: HIDDEN_WATERMARKS.length };
  } catch (e) { return { valid: false }; }
}

module.exports = {
  verifyIntegrity, checkWatermarks, getCurrentHash, getCoreHash
};
