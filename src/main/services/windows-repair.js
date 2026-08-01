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

async function runCommand(name, commands) {
  const results = [];
  for (const cmd of commands) {
    try {
      await runFireAndForget(cmd, 300000);
      results.push({ cmd: name, status: 'success' });
    } catch (error) {
      results.push({ cmd: name, status: 'failed', error: error.message });
    }
  }
  return results;
}

async function repairWindows() {
  const fixes = [];

  try {
    await runFireAndForget('sfc /scannow', 600000);
    fixes.push({ name: 'SFC - فحص وإصلاح ملفات النظام', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'SFC - فحص وإصلاح ملفات النظام', status: 'failed' });
  }

  try {
    await runFireAndForget('DISM /Online /Cleanup-Image /ScanHealth', 600000);
    fixes.push({ name: 'DISM - فحص صحة النظام', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'DISM - فحص صحة النظام', status: 'failed' });
  }

  try {
    await runFireAndForget('DISM /Online /Cleanup-Image /RestoreHealth', 600000);
    fixes.push({ name: 'DISM - استعادة صحة النظام', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'DISM - استعادة صحة النظام', status: 'failed' });
  }

  try {
    await runFireAndForget('sfc /scannow', 600000);
    fixes.push({ name: 'SFC - إعادة الفحص بعد DISM', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'SFC - إعادة الفحص بعد DISM', status: 'failed' });
  }

  return fixes;
}

async function repairWindowsUpdate() {
  const fixes = [];

  const services = ['wuauserv', 'cryptSvc', 'bits', 'msiserver'];
  for (const svc of services) {
    try {
      await runFireAndForget(`net stop ${svc}`, 30000);
      fixes.push({ name: `إيقاف ${svc}`, status: 'success' });
    } catch (e) {
      fixes.push({ name: `إيقاف ${svc}`, status: 'failed' });
    }
  }

  try {
    await runFireAndForget('ren C:\\Windows\\SoftwareDistribution SoftwareDistribution.old');
    fixes.push({ name: 'حذف SoftwareDistribution', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'حذف SoftwareDistribution', status: 'failed' });
  }

  try {
    await runFireAndForget('ren C:\\Windows\\System32\\catroot2 catroot2.old');
    fixes.push({ name: 'حذف catroot2', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'حذف catroot2', status: 'failed' });
  }

  for (const svc of services) {
    try {
      await runFireAndForget(`net start ${svc}`, 30000);
      fixes.push({ name: `تشغيل ${svc}`, status: 'success' });
    } catch (e) {
      fixes.push({ name: `تشغيل ${svc}`, status: 'failed' });
    }
  }

  try {
    await runFireAndForget('wuauclt /resetauthorization /detectnow', 60000);
    fixes.push({ name: 'إعادة تعيين Windows Update', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إعادة تعيين Windows Update', status: 'failed' });
  }

  return fixes;
}

async function repairRegistry() {
  const fixes = [];

  const regFixes = [
    { cmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" /v Shell /t REG_SZ /d explorer.exe /f', name: 'إصلاح Shell' },
    { cmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" /v Userinit /t REG_SZ /d "C:\\Windows\\system32\\userinit.exe," /f', name: 'إصلاح Userinit' },
    { cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Windows" /v ErrorMode /t REG_DWORD /d 0 /f', name: 'إصلاح Error Mode' },
    { cmd: 'reg add "HKCU\\Control Panel\\Desktop" /v AutoEndTasks /t REG_SZ /d 1 /f', name: 'تفعيل AutoEndTasks' },
    { cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f', name: 'تحسين أولوية المعالج' },
    { cmd: 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v HideFileExt /t REG_DWORD /d 0 /f', name: 'إظهار امتدادات الملفات' },
    { cmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA /t REG_DWORD /d 1 /f', name: 'تفعيل UAC' },
    { cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v ClearPageFileAtShutdown /t REG_DWORD /d 0 /f', name: 'تحسين إدارة الذاكرة' }
  ];

  for (const fix of regFixes) {
    try {
      await runFireAndForget(fix.cmd, 10000);
      fixes.push({ name: fix.name, status: 'success' });
    } catch (e) {
      fixes.push({ name: fix.name, status: 'failed' });
    }
  }

  return fixes;
}

async function repairDLL() {
  const fixes = [];

  try {
    await runFireAndForget('regsvr32 /s urlmon.dll', 30000);
    fixes.push({ name: 'إصلاح urlmon.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح urlmon.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s mshtml.dll', 30000);
    fixes.push({ name: 'إصلاح mshtml.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح mshtml.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s shdocvw.dll', 30000);
    fixes.push({ name: 'إصلاح shdocvw.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح shdocvw.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s browseui.dll', 30000);
    fixes.push({ name: 'إصلاح browseui.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح browseui.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s jscript.dll', 30000);
    fixes.push({ name: 'إصلاح jscript.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح jscript.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s vbscript.dll', 30000);
    fixes.push({ name: 'إصلاح vbscript.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح vbscript.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s scrrun.dll', 30000);
    fixes.push({ name: 'إصلاح scrrun.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح scrrun.dll', status: 'failed' });
  }

  try {
    await runFireAndForget('regsvr32 /s msxml.dll', 30000);
    fixes.push({ name: 'إصلاح msxml.dll', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح msxml.dll', status: 'failed' });
  }

  return fixes;
}

async function fullWindowsRepair() {
  const allResults = [];

  const sfc = await repairWindows();
  allResults.push(...sfc);

  const registry = await repairRegistry();
  allResults.push(...registry);

  const dll = await repairDLL();
  allResults.push(...dll);

  const windowsUpdate = await repairWindowsUpdate();
  allResults.push(...windowsUpdate);

  return allResults;
}

module.exports = {
  repairWindows,
  repairWindowsUpdate,
  repairRegistry,
  repairDLL,
  fullWindowsRepair
};
