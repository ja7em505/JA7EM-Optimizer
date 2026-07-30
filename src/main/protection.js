const fs = require('fs');
const path = require('path');
const integrity = require('./integrity');
const licenseManager = require('./license-manager');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');
const MODLOG_FILE = path.join(CONFIG_DIR, 'modifications.log');

let _debuggerDetected = false;
let _integrityPassed = false;
let _licenseValid = false;

function isDebuggerAttached() {
  try {
    const start = Date.now();
    for (let i = 0; i < 100; i++) { Math.random(); }
    if (Date.now() - start > 100) return true;
  } catch (e) {}
  return false;
}

function monitorDebugger(mainWindow) {
  setInterval(() => {
    if (isDebuggerAttached()) {
      _debuggerDetected = true;
      logModification('debugger_detected', 'Debugger detected');
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('security-alert', 'debugger');
        }
      } catch (e) {}
    }
  }, 10000);
}

function checkDevTools(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (mainWindow.webContents.isDebuggerAttached()) {
      _debuggerDetected = true;
      logModification('devtools_opened', 'DevTools attached');
      mainWindow.webContents.closeDevTools();
    }
  } catch (e) {}
}

function logModification(type, details) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    const entry = { type, details, time: new Date().toISOString(), device: licenseManager.getDeviceInfo() };
    let logs = [];
    if (fs.existsSync(MODLOG_FILE)) {
      try { logs = JSON.parse(fs.readFileSync(MODLOG_FILE, 'utf8')); } catch (e) {}
    }
    logs.push(entry);
    if (logs.length > 50) logs = logs.slice(-50);
    fs.writeFileSync(MODLOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {}
}

function getModificationLogs() {
  try {
    if (!fs.existsSync(MODLOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(MODLOG_FILE, 'utf8'));
  } catch (e) { return []; }
}

function runFullSecurityCheck(mainWindow) {
  const results = {
    integrity: { passed: false },
    debugger: { attached: false },
    watermarks: { passed: false },
    signature: { valid: false },
    license: { valid: false }
  };

  try { const r = integrity.verifyIntegrity(); results.integrity.passed = r.valid; _integrityPassed = r.valid; } catch (e) {}
  try { results.debugger.attached = isDebuggerAttached(); if (results.debugger.attached) _debuggerDetected = true; } catch (e) {}
  try { const wm = integrity.checkWatermarks(); results.watermarks.passed = wm.valid; } catch (e) {}
  try { results.signature.valid = integrity.verifySignature(); } catch (e) {}
  try { const saved = licenseManager.getSavedLicense(); if (saved && saved.key) { results.license.valid = true; _licenseValid = true; } } catch (e) {}

  return results;
}

function initialize(mainWindow) {
  integrity.saveIntegrityHash();
  integrity.saveSignature();
  monitorDebugger(mainWindow);
  setInterval(() => checkDevTools(mainWindow), 5000);
  return runFullSecurityCheck(mainWindow);
}

module.exports = {
  initialize, runFullSecurityCheck, isDebuggerAttached, monitorDebugger,
  checkDevTools, logModification, getModificationLogs,
  isDebuggerDetected: () => _debuggerDetected,
  isIntegrityPassed: () => _integrityPassed,
  isLicenseValid: () => _licenseValid
};
