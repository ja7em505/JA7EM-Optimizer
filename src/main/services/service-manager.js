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

async function getServices() {
  const services = [];

  try {
    const output = await runPs('powershell -Command "Get-Service | Select-Object Name,DisplayName,Status,StartType | Sort-Object DisplayName | ConvertTo-Json"', 20000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const svc of arr) {
      services.push({
        name: svc.Name,
        displayName: svc.DisplayName || svc.Name,
        status: svc.Status,
        startType: svc.StartType
      });
    }
  } catch (e) { }

  return services;
}

async function startService(name) {
  try {
    await runFireAndForget(`powershell -Command "Start-Service -Name '${name}'"`, 30000);
    return { status: 'success', message: `تم تشغيل ${name}` };
  } catch (e) {
    return { status: 'failed', message: `فشل تشغيل ${name}: ${e.message}` };
  }
}

async function stopService(name) {
  try {
    await runFireAndForget(`powershell -Command "Stop-Service -Name '${name}' -Force"`, 30000);
    return { status: 'success', message: `تم إيقاف ${name}` };
  } catch (e) {
    return { status: 'failed', message: `فشل إيقاف ${name}: ${e.message}` };
  }
}

async function restartService(name) {
  try {
    await runFireAndForget(`powershell -Command "Restart-Service -Name '${name}' -Force"`, 30000);
    return { status: 'success', message: `تم إعادة تشغيل ${name}` };
  } catch (e) {
    return { status: 'failed', message: `فشل إعادة تشغيل ${name}: ${e.message}` };
  }
}

async function setServiceStartup(name, startType) {
  try {
    const typeMap = { 'auto': 'Automatic', 'manual': 'Manual', 'disabled': 'Disabled' };
    const type = typeMap[startType] || startType;
    await runFireAndForget(`powershell -Command "Set-Service -Name '${name}' -StartupType ${type}"`, 15000);
    return { status: 'success', message: `تم تغيير نوع بدء ${name} إلى ${type}` };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

module.exports = { getServices, startService, stopService, restartService, setServiceStartup };
