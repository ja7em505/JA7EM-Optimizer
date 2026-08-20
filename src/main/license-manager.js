const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'CJ-Optimizer');
const LICENSE_FILE = path.join(CONFIG_DIR, 'license.dat');
const ATTEMPTS_FILE = path.join(CONFIG_DIR, 'attempts.log');
const CACHE_FILE = path.join(CONFIG_DIR, 'license_cache.dat');
const BAN_FILE = path.join(CONFIG_DIR, 'ban.dat');

const BAN_THRESHOLD = 5;
const BAN_WINDOW_MS = 24 * 60 * 60 * 1000;

const REPO_OWNER = 'ja7em505';
const REPO_NAME = 'license-data';
const REPO_PATH = 'license.json';
const REPO_API = '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + REPO_PATH;
const GITHUB_TOKEN = require('./license-token');

const ENCRYPTION_KEY = crypto.createHash('sha256').update('JA7EM-OPTIMIZER-2024-SECURE-KEY').digest();
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return 'CJ-' + segments.join('-');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key.toUpperCase().trim()).digest('hex');
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'CJ-Optimizer',
        'Authorization': 'Bearer ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) { resolve(null); return; }
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function apiPut(path, payload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: 'PUT',
      headers: {
        'User-Agent': 'CJ-Optimizer',
        'Authorization': 'Bearer ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => d += chunk);
      res.on('end', () => {
        let body = null;
        try { body = JSON.parse(d); } catch (e) {}
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const err = new Error('Repo API ' + res.statusCode + ': ' + ((body && body.message) || 'write failed'));
          err.status = res.statusCode;
          reject(err);
          return;
        }
        resolve(body);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function fetchFromGist() {
  return new Promise((resolve, reject) => {
    apiGet(REPO_API).then((file) => {
      if (!file) { resolve(null); return; }
      try {
        resolve(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
      } catch (e) { reject(e); }
    }).catch(reject);
  });
}

function getRepoFileSha() {
  return apiGet(REPO_API).then(f => f ? f.sha : null);
}

async function pushToGist(data) {
  try {
    let existing = null;
    try { existing = await fetchFromGist(); } catch (e) {}
    let sha = null;
    try { sha = await getRepoFileSha(); } catch (e) {}
    let merged;
    if (existing && data.type === 'crack_attempts') {
      merged = { keys: existing.keys || [], crack_attempts: data.attempts || [], banned_devices: existing.banned_devices || [] };
    } else if (data.type === 'ban') {
      merged = existing || { keys: [], crack_attempts: [], banned_devices: [] };
      if (!merged.keys) merged.keys = [];
      if (!merged.crack_attempts) merged.crack_attempts = [];
      if (!merged.banned_devices) merged.banned_devices = [];
      if (!merged.banned_devices.some(b => b.deviceId === data.deviceId)) {
        merged.banned_devices.push({ deviceId: data.deviceId, reason: data.reason, time: new Date().toISOString() });
      }
    } else if (data.keys) {
      merged = data;
      if (existing && existing.crack_attempts) merged.crack_attempts = existing.crack_attempts;
      if (existing && existing.banned_devices) merged.banned_devices = existing.banned_devices;
    } else {
      merged = existing || { keys: [] };
    }
    const content = Buffer.from(JSON.stringify(merged, null, 2), 'utf8').toString('base64');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const putBody = { message: 'update license data', content: content };
        if (sha) putBody.sha = sha;
        await apiPut(REPO_API, JSON.stringify(putBody));
        return true;
      } catch (e) {
        if (e.status === 409 && attempt < 2) {
          try { sha = await getRepoFileSha(); } catch (e2) {}
          continue;
        }
        return null;
      }
    }
    return null;
  } catch (e) { return null; }
}

function logCrackAttempt(key, reason, deviceInfo) {
  try {
    ensureConfigDir();
    const attempt = { key, reason, time: new Date().toISOString(), device: deviceInfo || 'Unknown' };
    let attempts = [];
    if (fs.existsSync(ATTEMPTS_FILE)) {
      try { attempts = JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf8')); } catch (e) {}
    }
    attempts.push(attempt);
    if (attempts.length > 100) attempts = attempts.slice(-100);
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
    pushToGist({ type: 'crack_attempts', attempts: attempts.slice(-20) }).catch(() => {});
  } catch (e) {}
}

function getDeviceInfo() {
  const os = require('os');
  return { hostname: os.hostname(), platform: os.platform(), arch: os.arch(), user: os.userInfo().username };
}

async function validateLicense(key) {
  try {
    const upperKey = key.toUpperCase().trim();
    const formatOk = /^CJ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(upperKey);

    let gistData = null;
    try {
      gistData = await fetchFromGist();
    } catch (e) {
      if (getLocalBan()) return { valid: false, reason: 'device_banned' };
      const cached = getCache();
      if (cached && cached.key === upperKey) {
        return { valid: true, expiry: cached.expiry, type: cached.type, cached: true };
      }
      return { valid: false, reason: 'offline' };
    }

    if (!gistData || !gistData.keys) {
      if (getLocalBan()) return { valid: false, reason: 'device_banned' };
      return { valid: false, reason: 'no_keys' };
    }

    const bannedList = gistData.banned_devices || [];
    if (bannedList.some(b => b.deviceId === getDeviceId())) {
      saveLocalBan('device_banned');
      return { valid: false, reason: 'device_banned' };
    }
    if (getLocalBan()) clearLocalBan();

    if (!formatOk) {
      logCrackAttempt(upperKey, 'invalid_format', getDeviceInfo());
      if (countRecentFailedAttempts(gistData) >= BAN_THRESHOLD) {
        await banDevice('too_many_failed_attempts');
        return { valid: false, reason: 'device_banned' };
      }
      return { valid: false, reason: 'invalid_format' };
    }

    const keyHash = hashKey(upperKey);
    const keyEntry = gistData.keys.find(k => k.hash === keyHash);

    if (!keyEntry) {
      logCrackAttempt(upperKey, 'key_not_found', getDeviceInfo());
      if (countRecentFailedAttempts(gistData) >= BAN_THRESHOLD) {
        await banDevice('too_many_failed_attempts');
        return { valid: false, reason: 'device_banned' };
      }
      return { valid: false, reason: 'key_not_found' };
    }

    if (keyEntry.status === 'revoked') {
      logCrackAttempt(upperKey, 'key_revoked', getDeviceInfo());
      return { valid: false, reason: 'key_revoked' };
    }

    if (keyEntry.expiry && new Date(keyEntry.expiry) < new Date()) {
      logCrackAttempt(upperKey, 'key_expired', getDeviceInfo());
      return { valid: false, reason: 'key_expired' };
    }

    if (keyEntry.maxDevices) {
      const deviceId = getDeviceId();
      if (!keyEntry.devices) keyEntry.devices = [];
      if (!keyEntry.devices.includes(deviceId)) {
        if (keyEntry.devices.length >= keyEntry.maxDevices) {
          logCrackAttempt(upperKey, 'max_devices_reached', getDeviceInfo());
          return { valid: false, reason: 'max_devices_reached' };
        }
        keyEntry.devices.push(deviceId);
        keyEntry.last_used = new Date().toISOString();
        gistData.keys = gistData.keys.map(k => k.hash === keyHash ? keyEntry : k);
        pushToGist(gistData).catch(() => {});
      }
    }

    saveCache(upperKey, keyEntry.expiry, keyEntry.type || 'standard');
    return { valid: true, expiry: keyEntry.expiry, type: keyEntry.type || 'standard' };
  } catch (e) {
    return { valid: false, reason: 'error', error: e.message };
  }
}

function getDeviceId() {
  const os = require('os');
  const data = os.hostname() + os.platform() + os.arch();
  return crypto.createHash('md5').update(data).digest('hex').substring(0, 16);
}

function deviceIdFromAttempt(attempt) {
  if (!attempt || !attempt.device || typeof attempt.device !== 'object') return null;
  const data = (attempt.device.hostname || '') + (attempt.device.platform || '') + (attempt.device.arch || '');
  if (!data) return null;
  return crypto.createHash('md5').update(data).digest('hex').substring(0, 16);
}

function countRecentFailedAttempts(gistData) {
  try {
    const deviceId = getDeviceId();
    const attempts = (gistData && gistData.crack_attempts) || [];
    const now = Date.now();
    return attempts.filter(a => {
      if (!a.time) return false;
      try { if (now - new Date(a.time).getTime() > BAN_WINDOW_MS) return false; } catch (e) { return false; }
      return deviceIdFromAttempt(a) === deviceId;
    }).length;
  } catch (e) { return 0; }
}

function getLocalBan() {
  try {
    if (!fs.existsSync(BAN_FILE)) return null;
    const data = JSON.parse(decrypt(fs.readFileSync(BAN_FILE, 'utf8')));
    if (data.deviceId !== getDeviceId()) return null;
    return data;
  } catch (e) { return null; }
}

function saveLocalBan(reason) {
  try {
    ensureConfigDir();
    const data = { deviceId: getDeviceId(), reason, time: new Date().toISOString() };
    fs.writeFileSync(BAN_FILE, encrypt(JSON.stringify(data)));
  } catch (e) {}
}

function clearLocalBan() {
  try { if (fs.existsSync(BAN_FILE)) fs.unlinkSync(BAN_FILE); } catch (e) {}
}

async function fetchBannedStatus() {
  try {
    const gistData = await fetchFromGist();
    return (gistData && gistData.banned_devices) || [];
  } catch (e) { return null; }
}

async function getBannedDevices() {
  const banned = await fetchBannedStatus();
  return banned || [];
}

async function isDeviceBanned() {
  const banned = await fetchBannedStatus();
  if (banned === null) {
    try { if (getLocalBan()) return true; } catch (e) {}
    return false;
  }
  if (banned.some(b => b.deviceId === getDeviceId())) {
    saveLocalBan('device_banned');
    return true;
  }
  clearLocalBan();
  return false;
}

async function tryForgiveBan() {
  const banned = await fetchBannedStatus();
  if (banned === null) return { forgiven: false, offline: true };
  if (banned.some(b => b.deviceId === getDeviceId())) return { forgiven: false };
  clearLocalBan();
  return { forgiven: true };
}

async function banDevice(reason) {
  try {
    const deviceId = getDeviceId();
    saveLocalBan(reason);
    await pushToGist({ type: 'ban', deviceId, reason });
  } catch (e) {}
}

function clearSavedLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) fs.unlinkSync(LICENSE_FILE);
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch (e) {}
}

async function revalidateSaved() {
  const saved = getSavedLicense();
  if (!saved || !saved.key) return { valid: false, reason: 'no_license' };
  return await validateLicense(saved.key);
}

function saveCache(key, expiry, type) {
  try {
    ensureConfigDir();
    const data = { key, expiry, type, timestamp: Date.now() };
    fs.writeFileSync(CACHE_FILE, encrypt(JSON.stringify(data)));
  } catch (e) {}
}

function getCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const data = JSON.parse(decrypt(raw));
    if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch (e) { return null; }
}

function saveLicense(key, data) {
  try {
    ensureConfigDir();
    const enc = encrypt(JSON.stringify({ key, ...data }));
    fs.writeFileSync(LICENSE_FILE, enc);
  } catch (e) {}
}

function getSavedLicense() {
  try {
    if (!fs.existsSync(LICENSE_FILE)) return null;
    const raw = fs.readFileSync(LICENSE_FILE, 'utf8');
    return JSON.parse(decrypt(raw));
  } catch (e) { return null; }
}

function getAttempts() {
  try {
    if (!fs.existsSync(ATTEMPTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ATTEMPTS_FILE, 'utf8'));
  } catch (e) { return []; }
}

function getLicenseStatus() {
  const saved = getSavedLicense();
  if (!saved || !saved.key) return { active: false, status: 'none' };
  if (saved.expiry && new Date(saved.expiry) < new Date()) {
    return { active: false, status: 'expired', key: saved.key, type: saved.type, expiry: saved.expiry };
  }
  return { active: true, status: 'active', key: saved.key, type: saved.type, expiry: saved.expiry };
}

function isLicenseActive() {
  return getLicenseStatus().active;
}

module.exports = {
  generateKey, hashKey, validateLicense, saveLicense, getSavedLicense,
  logCrackAttempt, getAttempts, fetchFromGist, pushToGist, getDeviceInfo, getDeviceId,
  getLicenseStatus, isLicenseActive,
  clearSavedLicense, revalidateSaved, isDeviceBanned, getBannedDevices, banDevice,
  countRecentFailedAttempts, getLocalBan, clearLocalBan, fetchBannedStatus, tryForgiveBan
};
