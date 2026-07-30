const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

const bloatwareProcesses = [
  'Cortana.exe',
  'YourPhone.exe',
  'GameBarPresenceWriter.exe',
  'GameBar.exe',
  'XboxApp.exe',
  'XboxTCUI.exe',
  'OneDrive.exe',
  'OneDriveStandaloneUpdater.exe'
];

const servicesToDisable = [
  'SysMain',
  'WSearch',
  'diagnosticshub.standardcollector.service',
  'dmwappushservice',
  'MapsBroker',
  'lfsvc',
  'SharedAccess'
];

const safeToSkip = [
  'svchost.exe', 'csrss.exe', 'wininit.exe', 'winlogon.exe',
  'services.exe', 'lsass.exe', 'smss.exe', 'dwm.exe',
  'explorer.exe', 'sihost.exe', 'taskhostw.exe', 'RuntimeBroker.exe',
  'ShellExperienceHost.exe', 'SearchUI.exe', 'StartMenuExperienceHost.exe',
  'fontdrvhost.exe', 'dllhost.exe', 'WmiPrvSE.exe', 'audiodg.exe',
  'spoolsv.exe', 'SecurityHealthService.exe', 'MsMpEng.exe',
  'NisSrv.exe', 'SearchIndexer.exe', 'SearchProtocolHost.exe',
  'conhost.exe', 'dllhst32.exe', 'WerFault.exe', 'WerMgr.exe'
];

let gameModeActive = false;
let savedServices = {};
let closedProcesses = [];

async function getRunningProcesses() {
  try {
    const output = await runPs(
      'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\' -or $_.ProcessName -match \'(discord|chrome|firefox|spotify|steam|epic|obs|teams|zoom|skype|telegram|whatsapp|slack|notepad|vscode|code|sublime|brave|opera|vivaldi|edge|calc|paint|mspaint|snippingtool|photos|media|vlc|potplayer|itunes|spotify|steam|origin|uplay|gog|battle|riot|blizzard|ea\\.)\'} | Select-Object Id, ProcessName, MainWindowTitle, WorkingSet64 | Sort-Object ProcessName | ConvertTo-Json -Compress"',
      10000
    );
    const processes = JSON.parse(output);
    const unique = new Map();
    const result = Array.isArray(processes) ? processes : [processes];
    for (const p of result) {
      if (!p || !p.ProcessName) continue;
      if (safeToSkip.includes(p.ProcessName)) continue;
      const key = p.ProcessName.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, {
          pid: p.Id,
          name: p.ProcessName,
          title: p.MainWindowTitle || '',
          memory: p.WorkingSet64 ? Math.round(p.WorkingSet64 / 1024 / 1024) : 0
        });
      }
    }
    return Array.from(unique.values());
  } catch (e) {
    return [];
  }
}

async function activateGameMode(selectedProcs = []) {
  const results = [];
  closedProcesses = [];
  results.push({ name: 'تفعيل وضع الألعاب', status: 'success' });

  for (const proc of bloatwareProcesses) {
    try {
      await runFire(`taskkill /F /IM "${proc}" 2>nul`, 5000);
      results.push({ name: `إغلاق ${proc}`, status: 'success' });
    } catch (e) { }
  }

  for (const proc of selectedProcs) {
    try {
      const res = await runFire(`taskkill /F /IM "${proc}.exe" 2>nul`, 5000);
      closedProcesses.push(proc);
      results.push({ name: `إغلاق ${proc}.exe`, status: 'success' });
    } catch (e) {
      results.push({ name: `إغلاق ${proc}.exe`, status: 'failed' });
    }
  }

  for (const svc of servicesToDisable) {
    try {
      const check = await runPs(`sc query "${svc}" 2>nul`, 5000);
      if (check.includes('RUNNING')) {
        try {
          const startType = await runPs(`sc qc "${svc}" 2>nul`, 5000);
          savedServices[svc] = startType.includes('AUTO_START') ? 'auto' : 'demand';
        } catch (e) { savedServices[svc] = 'demand'; }
        await runFire(`sc stop "${svc}" 2>nul`, 10000);
        results.push({ name: `إيقاف ${svc}`, status: 'success' });
      }
    } catch (e) { }
  }

  try {
    await runFire('powershell -Command "Get-Process | Where-Object {$_.PriorityClass -ne \'High\' -and $_.MainWindowTitle -ne \'\'} | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::AboveNormal }"', 15000);
    results.push({ name: 'رفع أولوية البرامج', status: 'success' });
  } catch (e) {
    results.push({ name: 'رفع أولوية البرامج', status: 'failed' });
  }

  try {
    await runFire('powershell -Command "$cpu = (Get-WmiObject Win32_Processor).LoadPercentage; if($cpu -lt 50) { powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100; powercfg /setactive SCHEME_CURRENT }"', 10000);
    results.push({ name: 'تحسين أداء المعالج', status: 'success' });
  } catch (e) {
    results.push({ name: 'تحسين أداء المعالج', status: 'failed' });
  }

  gameModeActive = true;
  return { results, mode: 'active' };
}

async function deactivateGameMode() {
  const results = [];
  results.push({ name: 'إيقاف وضع الألعاب', status: 'success' });

  for (const [svc, prevType] of Object.entries(savedServices)) {
    try {
      await runFire(`sc config "${svc}" start= ${prevType} 2>nul`, 10000);
      await runFire(`sc start "${svc}" 2>nul`, 10000);
      results.push({ name: `إعادة تشغيل ${svc}`, status: 'success' });
    } catch (e) { }
  }
  savedServices = {};

  gameModeActive = false;
  return { results, mode: 'inactive' };
}

function getGameModeStatus() {
  return { active: gameModeActive };
}

module.exports = { activateGameMode, deactivateGameMode, getGameModeStatus, getRunningProcesses };
