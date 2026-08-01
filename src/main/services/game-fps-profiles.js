const fs = require('fs');
const path = require('path');

const PROFILES_FILE = path.join(process.env.APPDATA || process.env.HOME, 'CJ Optimizer', 'fps-profiles.json');

const DEFAULT_PROFILES = [
  {
    id: 'performance',
    name: 'أقصى أداء',
    settings: { disableGameDVR: true, enableHAGS: true, disableNetworkThrottling: true, systemResponsiveness: true, disableMouseAccel: true, disablePowerThrottling: true, priority: 'high', powerPlan: 'ultimate' }
  },
  {
    id: 'balanced',
    name: 'متوازن',
    settings: { disableGameDVR: true, enableHAGS: false, disableNetworkThrottling: true, systemResponsiveness: false, disableMouseAccel: false, disablePowerThrottling: false, priority: 'normal', powerPlan: 'balanced' }
  },
  {
    id: 'competitive',
    name: 'تنافسي',
    settings: { disableGameDVR: true, enableHAGS: true, disableNetworkThrottling: true, systemResponsiveness: true, disableMouseAccel: true, disablePowerThrottling: true, priority: 'realtime', powerPlan: 'ultimate' }
  },
  {
    id: 'quality',
    name: 'أقصى جودة',
    settings: { disableGameDVR: false, enableHAGS: false, disableNetworkThrottling: false, systemResponsiveness: false, disableMouseAccel: false, disablePowerThrottling: false, priority: 'normal', powerPlan: 'balanced' }
  }
];

function ensureFile() {
  try {
    const dir = path.dirname(PROFILES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(PROFILES_FILE)) {
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(DEFAULT_PROFILES, null, 2), 'utf8');
    }
  } catch (e) {}
}

function readProfiles() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
  } catch {
    return [...DEFAULT_PROFILES];
  }
}

function writeProfiles(profiles) {
  ensureFile();
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (e) {}
}

async function getAllProfiles() {
  return readProfiles();
}

async function saveProfile(name, settings) {
  const profiles = readProfiles();
  const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  profiles.push({ id, name, settings, custom: true });
  writeProfiles(profiles);
  return { id, name, settings, custom: true };
}

async function updateProfile(id, name, settings) {
  const profiles = readProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return null;
  profiles[idx].name = name;
  profiles[idx].settings = settings;
  writeProfiles(profiles);
  return profiles[idx];
}

async function deleteProfile(id) {
  let profiles = readProfiles();
  profiles = profiles.filter(p => p.id !== id);
  writeProfiles(profiles);
  return { success: true };
}

async function resetToDefault() {
  writeProfiles(DEFAULT_PROFILES);
  return DEFAULT_PROFILES;
}

module.exports = { getAllProfiles, saveProfile, updateProfile, deleteProfile, resetToDefault };
