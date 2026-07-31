const fs = require('fs');
const path = require('path');
const integrity = require('./integrity');
const licenseManager = require('./license-manager');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');
const MODLOG_FILE = path.join(CONFIG_DIR, 'modifications.log');
const LOCK_FILE = path.join(CONFIG_DIR, 'lock.dat');

let _debuggerDetected = false;
let _integrityPassed = false;
let _licenseValid = false;
let _hardLocked = false;
let _debuggerStreak = 0;
let _violationListeners = [];

function isDebuggerAttached() {
  try {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) { Math.random(); }
    if (Date.now() - start > 100) return true;
  } catch (e) {}
  return false;
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

function isLocked() {
  try { return fs.existsSync(LOCK_FILE); } catch (e) { return false; }
}

function getLockReason() {
  try {
    if (!fs.existsSync(LOCK_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    return data.reason || null;
  } catch (e) { return null; }
}

function clearLock() {
  try { if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); } catch (e) {}
}

function hardLock(reason) {
  if (_hardLocked) return;
  _hardLocked = true;
  logModification('hard_lock', reason);
  try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ reason, time: new Date().toISOString(), device: licenseManager.getDeviceInfo() }));
  } catch (e) {}
  for (const cb of _violationListeners) { try { cb(reason); } catch (e) {} }
}

function onViolation(cb) { _violationListeners.push(cb); }

function checkDevTools(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (mainWindow.webContents.isDebuggerAttached()) {
      logModification('devtools_opened', 'DevTools attached');
      try { mainWindow.webContents.closeDevTools(); } catch (e) {}
    }
  } catch (e) {}
}

function emitSecurityAlert(mainWindow, reason) {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('security-alert', reason);
    }
  } catch (e) {}
}

function handleDebugger(mainWindow) {
  if (isDebuggerAttached()) {
    _debuggerStreak++;
    if (_debuggerStreak >= 3) {
      _debuggerDetected = true;
      emitSecurityAlert(mainWindow, 'debugger');
      hardLock('debugger_detected');
    }
  } else {
    _debuggerStreak = Math.max(0, _debuggerStreak - 1);
  }
}

function handleIntegrity(mainWindow) {
  let passed = false;
  try { passed = integrity.verifyIntegrity().valid; } catch (e) {}
  _integrityPassed = passed;
  if (!passed) {
    emitSecurityAlert(mainWindow, 'integrity');
    hardLock('integrity_failed');
  }
}

function handleWatermarks(mainWindow) {
  try {
    if (!integrity.checkWatermarks().valid) {
      emitSecurityAlert(mainWindow, 'integrity');
      hardLock('integrity_failed');
    }
  } catch (e) {}
}

async function handleLicenseRevalidation(mainWindow) {
  try {
    const banned = await licenseManager.isDeviceBanned();
    if (banned) {
      licenseManager.clearSavedLicense();
      emitSecurityAlert(mainWindow, 'banned');
      hardLock('device_banned');
      return;
    }
    const r = await licenseManager.revalidateSaved();
    if (r && r.valid === false && !['offline', 'no_license', 'no_keys', 'error'].includes(r.reason)) {
      licenseManager.clearSavedLicense();
      emitSecurityAlert(mainWindow, 'license');
      hardLock('license_revoked');
    }
  } catch (e) {}
}

function monitor(mainWindow) {
  let tick = 0;
  setInterval(async () => {
    tick++;
    try { handleIntegrity(mainWindow); } catch (e) {}
    try { handleWatermarks(mainWindow); } catch (e) {}
    try { handleDebugger(mainWindow); } catch (e) {}
    try { checkDevTools(mainWindow); } catch (e) {}
    if (tick % 12 === 0) {
      try { await handleLicenseRevalidation(mainWindow); } catch (e) {}
    }
  }, 5000);
}

function runFullSecurityCheck(mainWindow) {
  const results = {
    locked: isLocked(),
    integrity: { passed: false },
    debugger: { attached: false },
    watermarks: { passed: false },
    license: { valid: false }
  };
  try { const r = integrity.verifyIntegrity(); results.integrity.passed = r.valid; _integrityPassed = r.valid; } catch (e) {}
  try { results.debugger.attached = isDebuggerAttached(); } catch (e) {}
  try { const wm = integrity.checkWatermarks(); results.watermarks.passed = wm.valid; } catch (e) {}
  try { const saved = licenseManager.getSavedLicense(); if (saved && saved.key) { results.license.valid = true; _licenseValid = true; } } catch (e) {}
  return results;
}

function initialize(mainWindow) {
  const results = runFullSecurityCheck(mainWindow);
  if (results.locked) return results;
  if (!results.integrity.passed) hardLock('integrity_failed');
  monitor(mainWindow);
  return results;
}

module.exports = {
  initialize, runFullSecurityCheck, isDebuggerAttached, monitorDebugger: handleDebugger,
  checkDevTools, logModification, getModificationLogs, hardLock, isLocked, onViolation,
  getLockReason, clearLock,
  isDebuggerDetected: () => _debuggerDetected,
  isIntegrityPassed: () => _integrityPassed,
  isLicenseValid: () => _licenseValid
};
