const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function runPsScript(script, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), 'cj_ps_' + Date.now() + '.ps1');
    fs.writeFileSync(tmpFile, script, 'utf8');
    exec('powershell -NoProfile -ExecutionPolicy Bypass -File "' + tmpFile + '"', { encoding: 'utf8', timeout }, (err) => {
      try { fs.unlinkSync(tmpFile); } catch (e) {}
      if (err) reject(err);
      else resolve();
    });
  });
}

function runFireAndForget(cmd, timeout = 15000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

async function getRamInfo() {
  try {
    const output = await runPs(
      'powershell -NoProfile -Command "Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json"',
      10000
    );
    const data = JSON.parse(output);
    const totalKB = parseInt(data.TotalVisibleMemorySize);
    const freeKB = parseInt(data.FreePhysicalMemory);
    const usedKB = totalKB - freeKB;

    return {
      total: Math.round(totalKB / 1024),
      used: Math.round(usedKB / 1024),
      free: Math.round(freeKB / 1024),
      percentage: Math.round((usedKB / totalKB) * 100)
    };
  } catch (e) {
    return { total: 0, used: 0, free: 0, percentage: 0 };
  }
}

async function cleanRam() {
  const results = [];

  try {
    const before = await getRamInfo();

    try {
      await runPsScript(`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PsApi {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);
}
"@ -ErrorAction SilentlyContinue
Get-Process | Where-Object { $_.Handle -ne [IntPtr]::Zero } | ForEach-Object {
    [PsApi]::EmptyWorkingSet($_.Handle) | Out-Null
}
`, 30000);
      results.push({ name: 'تفريغ مجموعات العمل للعمليات', status: 'success' });
    } catch (e) {
      results.push({ name: 'تفريغ مجموعات العمل للعمليات', status: 'failed' });
    }

    try {
      await runFireAndForget(
        'powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); [System.GC]::Collect()"',
        10000
      );
      results.push({ name: 'تنظيف .NET Garbage Collection', status: 'success' });
    } catch (e) {
      results.push({ name: 'تنظيف .NET Garbage Collection', status: 'failed' });
    }

    try {
      await runFireAndForget(
        'powershell -NoProfile -Command "Clear-DnsClientCache"',
        10000
      );
      results.push({ name: 'مسح ذاكرة DNS المؤقتة', status: 'success' });
    } catch (e) {
      results.push({ name: 'مسح ذاكرة DNS المؤقتة', status: 'failed' });
    }

    try {
      await runFireAndForget(
        'powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"',
        15000
      );
      results.push({ name: 'تفريغ سلة المحذوفات', status: 'success' });
    } catch (e) {
      results.push({ name: 'تفريغ سلة المحذوفات', status: 'failed' });
    }

    try {
      await runFireAndForget(
        'powershell -NoProfile -Command "Stop-Service -Name SysMain -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2; Start-Service -Name SysMain -ErrorAction SilentlyContinue"',
        20000
      );
      results.push({ name: 'إعادة تشغيل SysMain (تفريغ الكاش)', status: 'success' });
    } catch (e) {
      results.push({ name: 'إعادة تشغيل SysMain (تفريغ الكاش)', status: 'failed' });
    }

    try {
      await runFireAndForget('rundll32.exe advapi32.dll,ProcessIdleTasks', 10000);
      results.push({ name: 'معالجة المهام الخاملة', status: 'success' });
    } catch (e) {
      results.push({ name: 'معالجة المهام الخاملة', status: 'failed' });
    }

    const after = await getRamInfo();
    const freed = after.free - before.free;

    return {
      results,
      before: before.free,
      after: after.free,
      freed: Math.max(0, freed),
      currentUsage: after.percentage
    };
  } catch (e) {
    return { results, before: 0, after: 0, freed: 0, currentUsage: 0 };
  }
}

async function setPriority(processName, priority) {
  try {
    const prioMap = {
      'realtime': 'RealTime',
      'high': 'High',
      'above': 'AboveNormal',
      'normal': 'Normal',
      'below': 'BelowNormal',
      'low': 'Idle'
    };
    const prio = prioMap[priority] || 'Normal';
    await runFireAndForget(
      'powershell -NoProfile -Command "Get-Process -Name \'' + processName.replace('.exe', '') + '\' -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::' + prio + ' }"',
      10000
    );
    return { status: 'success', message: 'تم تغيير أولوية ' + processName + ' إلى ' + prio };
  } catch (e) {
    return { status: 'failed', message: 'فشل: ' + e.message };
  }
}

module.exports = { getRamInfo, cleanRam, setPriority };
