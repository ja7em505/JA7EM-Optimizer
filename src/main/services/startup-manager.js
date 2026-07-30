const { exec } = require('child_process');
const path = require('path');

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

async function getStartupItems() {
  const items = [];

  const registryPaths = [
    { hive: 'HKLM', path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', scope: 'System' },
    { hive: 'HKLM', path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce', scope: 'System (Once)' },
    { hive: 'HKCU', path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', scope: 'User' },
    { hive: 'HKCU', path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce', scope: 'User (Once)' }
  ];

  for (const reg of registryPaths) {
    try {
      const output = await runPs(`reg query "${reg.hive}\\${reg.path}" 2>nul`, 10000);
      const lines = output.split('\n').filter(l => l.trim() && !l.startsWith('HK'));
      for (const line of lines) {
        const parts = line.trim().split(/\s{3,}/);
        if (parts.length >= 2) {
          items.push({
            name: parts[0],
            command: parts.slice(1).join(' ').trim(),
            scope: reg.scope,
            registryKey: `${reg.hive}\\${reg.path}`,
            enabled: true
          });
        }
      }
    } catch (e) { }
  }

  try {
    const shell = await runPs('powershell -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location | ConvertTo-Json"', 15000);
    const parsed = JSON.parse(shell);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of arr) {
      if (item.Name && !items.find(i => i.name === item.Name)) {
        items.push({
          name: item.Name,
          command: item.Command || '',
          scope: item.Location || 'Startup Folder',
          registryKey: 'Startup Folder',
          enabled: true
        });
      }
    }
  } catch (e) { }

  return items;
}

async function toggleStartupItem(registryKey, name, enable) {
  try {
    if (enable) {
      return { status: 'success', message: `${name} مفعّل` };
    } else {
      try {
        await runFireAndForget(`reg delete "${registryKey}" /v "${name}" /f`, 10000);
      } catch (e) {
        await runFireAndForget(`reg delete "${registryKey}" /v ${name} /f`, 10000);
      }
      return { status: 'success', message: `${name} تم تعطيله` };
    }
  } catch (e) {
    return { status: 'failed', message: `فشل تعطيل ${name}: ${e.message}` };
  }
}

async function removeStartupItem(registryKey, name) {
  try {
    try {
      await runFireAndForget(`reg delete "${registryKey}" /v "${name}" /f`, 10000);
    } catch (e) {
      await runFireAndForget(`reg delete "${registryKey}" /v ${name} /f`, 10000);
    }
    return { status: 'success', message: `تم حذف ${name}` };
  } catch (e) {
    return { status: 'failed', message: `فشل حذف ${name}: ${e.message}` };
  }
}

module.exports = { getStartupItems, toggleStartupItem, removeStartupItem };
