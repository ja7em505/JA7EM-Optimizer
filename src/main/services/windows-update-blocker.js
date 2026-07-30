const { exec } = require('child_process');

function run(cmd, timeout = 15000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

async function blockWindowsUpdate() {
  const cmds = [
    'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate /t REG_DWORD /d 1 /f',
    'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config" /v DODownloadMode /t REG_DWORD /d 0 /f',
    'sc stop wuauserv',
    'sc config wuauserv start=disabled',
    'sc stop UsoSvc',
    'sc config UsoSvc start=disabled',
    'sc stop DoSvc',
    'sc config DoSvc start=disabled',
    'schtasks /change /disable /tn "\\Microsoft\\Windows\\WindowsUpdate\\Scheduled Start"',
    'schtasks /change /disable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan"',
    'schtasks /change /disable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Backup Scan"',
    'schtasks /change /disable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Work"'
  ];
  const results = [];
  for (const cmd of cmds) {
    try { await run(cmd); results.push({ cmd: cmd.split('/v ')[1] || cmd, status: 'success' }); }
    catch { results.push({ cmd: cmd.split('/v ')[1] || cmd, status: 'failed' }); }
  }
  return results;
}

async function unblockWindowsUpdate() {
  const cmds = [
    'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate /f',
    'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config" /v DODownloadMode /f',
    'sc config wuauserv start=auto',
    'sc start wuauserv',
    'sc config UsoSvc start=auto',
    'sc start UsoSvc',
    'sc config DoSvc start=auto',
    'sc start DoSvc',
    'schtasks /change /enable /tn "\\Microsoft\\Windows\\WindowsUpdate\\Scheduled Start"',
    'schtasks /change /enable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan"',
    'schtasks /change /enable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Backup Scan"',
    'schtasks /change /enable /tn "\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Work"'
  ];
  const results = [];
  for (const cmd of cmds) {
    try { await run(cmd); results.push({ cmd: cmd.split('/v ')[1] || cmd, status: 'success' }); }
    catch { results.push({ cmd: cmd.split('/v ')[1] || cmd, status: 'failed' }); }
  }
  return results;
}

async function getStatus() {
  const checks = [
    { id: 'wuauserv', name: 'خدمة Windows Update', check: 'sc query wuauserv | findstr STATE' },
    { id: 'usoSvc', name: 'خدمة Update Orchestrator', check: 'sc query UsoSvc | findstr STATE' },
    { id: 'dosvc', name: 'خدمة Delivery Optimization', check: 'sc query DoSvc | findstr STATE' },
    { id: 'policy', name: 'سياسة إيقاف التحديثات', check: 'reg query "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate 2>nul' }
  ];
  const results = [];
  for (const c of checks) {
    try {
      const { stdout } = await exec(c.check, { timeout: 5000 });
      const blocked = stdout.includes('DISABLED') || stdout.includes('0x1') || stdout.includes('NoAutoUpdate');
      results.push({ id: c.id, name: c.name, blocked: !!blocked, raw: stdout.trim() });
    } catch {
      results.push({ id: c.id, name: c.name, blocked: false, raw: 'error' });
    }
  }
  return results;
}

module.exports = { blockWindowsUpdate, unblockWindowsUpdate, getStatus };
