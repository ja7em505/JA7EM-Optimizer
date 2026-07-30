const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CONFIG_DIR = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');
const CHANGES_FILE = path.join(CONFIG_DIR, 'changes-log.json');

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadLog() {
  ensureDir();
  try {
    if (fs.existsSync(CHANGES_FILE)) return JSON.parse(fs.readFileSync(CHANGES_FILE, 'utf-8'));
  } catch (e) {}
  return { registry: [], services: [], powerPlan: null, bcdedit: [], processes: [], system: [] };
}

function saveLog(log) {
  ensureDir();
  fs.writeFileSync(CHANGES_FILE, JSON.stringify(log, null, 2), 'utf-8');
}

function addRegistryBackup(key, name, oldValue, oldType) {
  const log = loadLog();
  log.registry.push({ key, name, oldValue, oldType, timestamp: Date.now() });
  saveLog(log);
}

function addServiceChange(serviceName, originalStartType) {
  const log = loadLog();
  log.services.push({ serviceName, originalStartType, timestamp: Date.now() });
  saveLog(log);
}

function addPowerPlanChange(originalGuid) {
  const log = loadLog();
  log.powerPlan = { originalGuid, timestamp: Date.now() };
  saveLog(log);
}

function addBcdeditChange(entry, originalValue) {
  const log = loadLog();
  log.bcdedit.push({ entry, originalValue, timestamp: Date.now() });
  saveLog(log);
}

function addProcessKill(processName) {
  const log = loadLog();
  log.processes.push({ processName, timestamp: Date.now() });
  saveLog(log);
}

function addSystemChange(category, detail) {
  const log = loadLog();
  log.system.push({ category, detail, timestamp: Date.now() });
  saveLog(log);
}

function backupRegistryValue(key, name) {
  return new Promise((resolve) => {
    exec(`reg query "${key}" /v "${name}" 2>nul`, { encoding: 'utf8', timeout: 5000 }, (err, stdout) => {
      if (err) { resolve(null); return; }
      const match = stdout.match(/REG_\w+\s+(.+)/);
      if (match) {
        const typeMatch = stdout.match(/(REG_\w+)/);
        addRegistryBackup(key, name, match[1].trim(), typeMatch ? typeMatch[1] : 'REG_SZ');
      }
      resolve();
    });
  });
}

async function backupPowerPlan() {
  return new Promise((resolve) => {
    exec('powercfg /getactivescheme', { encoding: 'utf8', timeout: 5000 }, (err, stdout) => {
      if (err) { resolve(); return; }
      const match = stdout.match(/: ([a-f0-9\-]+)/);
      if (match) addPowerPlanChange(match[1]);
      resolve();
    });
  });
}

async function revertAllChanges() {
  const log = loadLog();
  const results = [];

  for (const reg of log.registry) {
    try {
      if (reg.oldValue && reg.oldType) {
        await new Promise((resolve) => {
          exec(`reg add "${reg.key}" /v "${reg.name}" /t ${reg.oldType} /d "${reg.oldValue}" /f`, { timeout: 5000 }, () => resolve());
        });
      } else {
        await new Promise((resolve) => {
          exec(`reg delete "${reg.key}" /v "${reg.name}" /f`, { timeout: 5000 }, () => resolve());
        });
      }
      results.push({ name: `إعادة ${reg.name}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة ${reg.name}`, status: 'failed' });
    }
  }

  for (const svc of log.services) {
    try {
      await new Promise((resolve) => {
        exec(`sc config "${svc.serviceName}" start= ${svc.originalStartType}`, { timeout: 5000 }, () => resolve());
      });
      results.push({ name: `إعادة خدمة ${svc.serviceName}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة خدمة ${svc.serviceName}`, status: 'failed' });
    }
  }

  if (log.powerPlan) {
    try {
      await new Promise((resolve) => {
        exec(`powercfg /setactive ${log.powerPlan.originalGuid}`, { timeout: 5000 }, () => resolve());
      });
      results.push({ name: 'إعادة خطة الطاقة', status: 'success' });
    } catch (e) {
      results.push({ name: 'إعادة خطة الطاقة', status: 'failed' });
    }
  }

  for (const bcd of log.bcdedit) {
    try {
      if (bcd.originalValue) {
        await new Promise((resolve) => {
          exec(`bcdedit /set ${bcd.entry} ${bcd.originalValue}`, { timeout: 5000 }, () => resolve());
        });
      } else {
        await new Promise((resolve) => {
          exec(`bcdedit /deletevalue ${bcd.entry}`, { timeout: 5000 }, () => resolve());
        });
      }
      results.push({ name: `إعادة ${bcd.entry}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة ${bcd.entry}`, status: 'failed' });
    }
  }

  saveLog({ registry: [], services: [], powerPlan: null, bcdedit: [], processes: [], system: [] });
  return results;
}

function getChangeLog() {
  return loadLog();
}

function clearLog() {
  saveLog({ registry: [], services: [], powerPlan: null, bcdedit: [], processes: [], system: [] });
}

module.exports = {
  backupRegistryValue, backupPowerPlan, revertAllChanges, getChangeLog, clearLog,
  addRegistryBackup, addServiceChange, addPowerPlanChange, addBcdeditChange, addProcessKill, addSystemChange
};
