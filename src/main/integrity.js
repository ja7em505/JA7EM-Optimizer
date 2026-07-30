const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');
const HASH_FILE = path.join(CONFIG_DIR, 'integrity.dat');
const SIGNATURE_FILE = path.join(CONFIG_DIR, 'signature.dat');

const PROTECTED_FILES = [
  'src/main/main.js',
  'src/main/license-manager.js',
  'src/main/integrity.js',
  'src/main/protection.js',
  'src/preload/preload.js',
  'src/renderer/index.html',
  'src/renderer/renderer.js',
  'src/renderer/styles/app.css'
];

const HIDDEN_WATERMARKS = ['JA7EM_OPTIMIZER_v1', 'BY_JA7EM_ONLY', 'DO_NOT_MODIFY'];

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

function generateIntegrityHash() {
  const root = getAppRoot();
  const hashes = {};
  for (const file of PROTECTED_FILES) {
    const hash = calculateFileHash(path.join(root, file));
    if (hash) hashes[file] = hash;
  }
  return crypto.createHash('sha256').update(Object.values(hashes).join('|')).digest('hex');
}

function saveIntegrityHash() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const hash = generateIntegrityHash();
    fs.writeFileSync(HASH_FILE, hash);
    return hash;
  } catch (e) { return null; }
}

function verifyIntegrity() {
  try {
    if (!fs.existsSync(HASH_FILE)) return { valid: false, reason: 'no_hash_file' };
    const savedHash = fs.readFileSync(HASH_FILE, 'utf8').trim();
    const currentHash = generateIntegrityHash();
    if (savedHash !== currentHash) return { valid: false, reason: 'file_modified' };
    return { valid: true };
  } catch (e) { return { valid: false, reason: 'error' }; }
}

function saveSignature() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const sig = crypto.createHash('sha256').update('JA7EM_AUTHENTIC_' + Date.now()).digest('hex');
    fs.writeFileSync(SIGNATURE_FILE, sig);
    return sig;
  } catch (e) { return null; }
}

function verifySignature() {
  try {
    if (!fs.existsSync(SIGNATURE_FILE)) return false;
    return fs.readFileSync(SIGNATURE_FILE, 'utf8').trim().length === 64;
  } catch (e) { return false; }
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
  generateIntegrityHash, saveIntegrityHash, verifyIntegrity,
  saveSignature, verifySignature, checkWatermarks
};
