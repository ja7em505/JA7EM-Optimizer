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

const STUTTER_FIXES = {
  timerResolution: {
    name: 'تحسين دقة المؤقت',
    description: 'يقلل التأخير ويخلي الفريمات أكثر سلاسة',
    commands: [
      'bcdedit /set useplatformtick yes',
      'bcdedit /set disabledynamictick yes'
    ],
    revert: [
      'bcdedit /deletevalue useplatformtick',
      'bcdedit /deletevalue disabledynamictick'
    ]
  },
  gameMode: {
    name: 'تفعيل Game Mode',
    description: 'يمكّن وضع الألعاب المحسّن',
    commands: [
      'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AllowAutoGameMode /t REG_DWORD /d 1 /f',
      'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f'
    ],
    revert: [
      'reg delete "HKCU\\Software\\Microsoft\\GameBar" /v AllowAutoGameMode /f',
      'reg delete "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /f'
    ]
  },
  fullscreenOptimization: {
    name: 'تعطيل Fullscreen Optimizations',
    description: 'يمنع Windows من إضافة طبقة على اللعبة',
    commands: [
      'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f',
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f'
    ],
    revert: [
      'reg delete "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /f',
      'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v AppCaptureEnabled /f'
    ]
  },
  backgroundApps: {
    name: 'إيقاف التطبيقات الخلفية',
    description: 'يحرر الذاكرة و المعالج للألعاب',
    commands: [
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" /v GlobalUserDisabled /t REG_DWORD /d 1 /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f'
    ],
    revert: [
      'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" /v GlobalUserDisabled /f',
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /f'
    ]
  },
  gpuScheduler: {
    name: 'تسريع جدولة GPU',
    description: 'يقلل تأخير المعالجة الرسومية',
    commands: [
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v GpuSchedule /t REG_DWORD /d 1 /f'
    ],
    revert: [
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /f',
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v GpuSchedule /f'
    ]
  },
  memoryManagement: {
    name: 'تحسين إدارة الذاكرة',
    description: 'يحسن تخصيص الذاكرة للألعاب',
    commands: [
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 0 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v DisablePagingExecutive /t REG_DWORD /d 1 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v ClearPageFileAtShutdown /t REG_DWORD /d 0 /f'
    ],
    revert: [
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /f',
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v DisablePagingExecutive /f',
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v ClearPageFileAtShutdown /f'
    ]
  },
  networkLatency: {
    name: 'تحسين الشبكة',
    description: 'يقلل تأخير الشبكة في الألعاب أونلاين',
    commands: [
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 0xffffffff /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f',
      'netsh int tcp set global autotuninglevel=normal'
    ],
    revert: [
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /f',
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /f',
      'netsh int tcp set global autotuninglevel=normal'
    ]
  },
  prioritySeparation: {
    name: 'تحسين أولوية المعالج',
    description: 'يعطي الأولوية للألعاب على المعالج',
    commands: [
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "GPU Priority" /t REG_DWORD /d 8 /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v Priority /t REG_DWORD /d 6 /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f',
      'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "Game Scheduler Prioritize" /t REG_DWORD /d 1 /f'
    ],
    revert: [
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /f',
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "GPU Priority" /f',
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v Priority /f',
      'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Scheduling Category" /f'
    ]
  },
  powerPlan: {
    name: 'خطة الطاقة高性能',
    description: 'يمنع خفض أداء المعالج والكرت',
    commands: [
      'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
      'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100',
      'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100',
      'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 1',
      'powercfg /setactive SCHEME_CURRENT'
    ],
    revert: [
      'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e'
    ]
  },
  disableTelemetry: {
    name: 'تعطيل جمع البيانات',
    description: 'يوقف خدمات Microsoft اللي تشتغل بالخلفية',
    commands: [
      'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f',
      'sc config DiagTrack start= disabled',
      'sc stop DiagTrack',
      'sc config dmwappushservice start= disabled',
      'sc stop dmwappushservice'
    ],
    revert: [
      'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /f',
      'sc config DiagTrack start= auto',
      'sc config dmwappushservice start= auto'
    ]
  },
  nvidiaOptimization: {
    name: 'تحسينات NVIDIA',
    description: 'تحسينات خاصة بكرت NVIDIA',
    commands: [
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000" /v RMHdcpKeyglobZero /t REG_DWORD /d 1 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" /v DisableWriteCombining /t REG_DWORD /d 1 /f'
    ],
    revert: [
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000" /v RMHdcpKeyglobZero /f',
      'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" /v DisableWriteCombining /f'
    ]
  },
  flushMemory: {
    name: 'تفريغ الذاكرة العشوائية',
    description: 'يحرر الذاكرة المستخدمة من التطبيقات القديمة',
    commands: [
      'powershell -NoProfile -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class PsApi { [DllImport(\\"psapi.dll\\")] public static extern int EmptyWorkingSet(IntPtr hwProc); }\' -ErrorAction SilentlyContinue; Get-Process | Where-Object { $_.Handle -ne [IntPtr]::Zero } | ForEach-Object { [PsApi]::EmptyWorkingSet($_.Handle) | Out-Null }"',
      'powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); [System.GC]::Collect()"',
      'powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"'
    ],
    revert: []
  }
};

const SERVICES_TO_KILL = [
  'OneDrive',
  'SkypeApp',
  'YourPhone',
  'MicrosoftEdge',
  'Spotify',
  'Discord',
  'SteamWebHelper'
];

async function applyStutterFix(options = {}) {
  const results = [];

  for (const [key, fix] of Object.entries(STUTTER_FIXES)) {
    if (options[key] === false) continue;

    try {
      for (const cmd of fix.commands) {
        await runFireAndForget(cmd, 15000);
      }
      results.push({ fix: fix.name, status: 'success', description: fix.description });
    } catch (error) {
      results.push({ fix: fix.name, status: 'failed', error: error.message });
    }
  }

  if (options.killBackground !== false) {
    for (const proc of SERVICES_TO_KILL) {
      try {
        await runFireAndForget(`taskkill /F /IM "${proc}.exe"`);
        results.push({ fix: `إغلاق ${proc}`, status: 'success' });
      } catch (e) {}
    }
  }

  try {
    await runFireAndForget('powershell -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
    results.push({ fix: 'تفريغ سلة المهملات', status: 'success' });
  } catch (e) {}

  return results;
}

async function revertStutterFix() {
  const results = [];

  for (const [key, fix] of Object.entries(STUTTER_FIXES)) {
    if (!fix.revert || fix.revert.length === 0) continue;

    try {
      for (const cmd of fix.revert) {
        await runFireAndForget(cmd, 15000);
      }
      results.push({ fix: `إعادة ${fix.name}`, status: 'success' });
    } catch (error) {
      results.push({ fix: `إعادة ${fix.name}`, status: 'failed', error: error.message });
    }
  }

  return results;
}

async function getFixDetails() {
  const fixes = [];
  for (const [key, fix] of Object.entries(STUTTER_FIXES)) {
    fixes.push({
      id: key,
      name: fix.name,
      description: fix.description,
      commandsCount: fix.commands.length
    });
  }
  return fixes;
}

module.exports = { applyStutterFix, revertStutterFix, getFixDetails, STUTTER_FIXES };
