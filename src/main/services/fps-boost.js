const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function runFireAndForget(cmd, timeout = 15000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

const TWEAKS = {
  disableGameDVR: {
    name: 'تعطيل Game DVR',
    registry: {
      path: 'HKCU\\System\\GameConfigStore',
      name: 'GameDVR_Enabled',
      value: 0,
      type: 'REG_DWORD'
    }
  },
  enableHAGS: {
    name: 'تفعيل HAGS (GPU Scheduling)',
    registry: {
      path: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers',
      name: 'HwSchMode',
      value: 2,
      type: 'REG_DWORD'
    }
  },
  disableNetworkThrottling: {
    name: 'تعطيل Network Throttling',
    registry: {
      path: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
      name: 'NetworkThrottlingIndex',
      value: '0xFFFFFFFF',
      type: 'REG_DWORD'
    }
  },
  systemResponsiveness: {
    name: 'تحسين استجابة النظام',
    registry: {
      path: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile',
      name: 'SystemResponsiveness',
      value: 0,
      type: 'REG_DWORD'
    }
  },
  gamePriority: {
    name: 'أولوية الألعاب',
    registry: {
      path: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games',
      name: 'GPU Priority',
      value: 8,
      type: 'REG_DWORD'
    }
  },
  disableMouseAccel: {
    name: 'تعطيل تسريع الماوس',
    registry: {
      path: 'HKCU\\Control Panel\\Mouse',
      name: 'MouseSpeed',
      value: '0',
      type: 'REG_SZ'
    }
  },
  disablePowerThrottling: {
    name: 'تعطيل تقييد الطاقة',
    registry: {
      path: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\\PowerThrottling',
      name: 'PowerThrottlingOff',
      value: 1,
      type: 'REG_DWORD'
    }
  }
};

const SERVICES_TO_DISABLE = [
  'SysMain',
  'DiagTrack',
  'WSearch'
];

async function applyBoost(options = {}) {
  const results = [];

  for (const [key, tweak] of Object.entries(TWEAKS)) {
    if (options[key] === false) continue;

    try {
      const { path, name, value, type } = tweak.registry;
      const cmd = `reg add "${path}" /v ${name} /t ${type} /d ${value} /f`;
      await runFireAndForget(cmd);
      results.push({ tweak: tweak.name, status: 'success' });
    } catch (error) {
      results.push({ tweak: tweak.name, status: 'failed', error: error.message });
    }
  }

  for (const service of SERVICES_TO_DISABLE) {
    try {
      await runFireAndForget(`sc config "${service}" start= disabled`);
      await runFireAndForget(`sc stop "${service}"`);
      results.push({ tweak: `تعطيل خدمة ${service}`, status: 'success' });
    } catch (error) {
      results.push({ tweak: `تعطيل خدمة ${service}`, status: 'failed', error: error.message });
    }
  }

  try {
    await runFireAndForget('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c');
    results.push({ tweak: 'تفعيل خطة الطاقة عالية الأداء', status: 'success' });
  } catch (error) {
    results.push({ tweak: 'تفعيل خطة الطاقة عالية الأداء', status: 'failed', error: error.message });
  }

  return results;
}

async function revertAll() {
  const results = [];

  for (const [key, tweak] of Object.entries(TWEAKS)) {
    try {
      const { path, name } = tweak.registry;
      await runFireAndForget(`reg delete "${path}" /v ${name} /f`);
      results.push({ tweak: `إعادة ${tweak.name}`, status: 'success' });
    } catch (error) {
      results.push({ tweak: `إعادة ${tweak.name}`, status: 'failed', error: error.message });
    }
  }

  for (const service of SERVICES_TO_DISABLE) {
    try {
      await runFireAndForget(`sc config "${service}" start= auto`);
      results.push({ tweak: `إعادة تفعيل خدمة ${service}`, status: 'success' });
    } catch (error) {
      results.push({ tweak: `إعادة تفعيل خدمة ${service}`, status: 'failed', error: error.message });
    }
  }

  return results;
}

module.exports = { applyBoost, revertAll, TWEAKS };
