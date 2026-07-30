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

async function getDefenderStatus() {
  try {
    const output = await runPs('powershell -Command "Get-MpPreference | Select-Object DisableRealtimeMonitoring,DisableBehaviorMonitoring,DisableOnAccessProtection,DisableIOAVProtection,DisableScriptScanning,ExclusionPath,ExclusionExtension,ExclusionProcess | ConvertTo-Json"', 15000);
    const prefs = JSON.parse(output);

    let status = 'Active';
    if (prefs.DisableRealtimeMonitoring) status = 'Disabled';

    let scanStatus = 'N/A';
    try {
      const scan = await runPs('powershell -Command "Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,QuickScanEndTime,FullScanEndTime | ConvertTo-Json"', 10000);
      const scanData = JSON.parse(scan);
      if (!scanData.AntivirusEnabled) status = 'Disabled';
      scanStatus = scanData.QuickScanEndTime || 'Never';
    } catch (e) { }

    const exclusions = {
      paths: Array.isArray(prefs.ExclusionPath) ? prefs.ExclusionPath : (prefs.ExclusionPath ? [prefs.ExclusionPath] : []),
      extensions: Array.isArray(prefs.ExclusionExtension) ? prefs.ExclusionExtension : (prefs.ExclusionExtension ? [prefs.ExclusionExtension] : []),
      processes: Array.isArray(prefs.ExclusionProcess) ? prefs.ExclusionProcess : (prefs.ExclusionProcess ? [prefs.ExclusionProcess] : [])
    };

    return {
      status,
      realtime: !prefs.DisableRealtimeMonitoring,
      behavior: !prefs.DisableBehaviorMonitoring,
      onAccess: !prefs.DisableOnAccessProtection,
      ioav: !prefs.DisableIOAVProtection,
      scriptScanning: !prefs.DisableScriptScanning,
      lastScan: scanStatus,
      exclusions
    };
  } catch (e) {
    return { status: 'Unknown', realtime: false, behavior: false, onAccess: false, ioav: false, scriptScanning: false, lastScan: 'N/A', exclusions: { paths: [], extensions: [], processes: [] } };
  }
}

async function toggleRealtime(enable) {
  try {
    const cmd = enable ? 'Set-MpPreference -DisableRealtimeMonitoring $false' : 'Set-MpPreference -DisableRealtimeMonitoring $true';
    await runFireAndForget(`powershell -Command "${cmd}"`, 15000);
    return { status: 'success', message: enable ? 'تم تفعيل الحماية الفورية' : 'تم تعطيل الحماية الفورية' };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function toggleBehavior(enable) {
  try {
    const cmd = enable ? 'Set-MpPreference -DisableBehaviorMonitoring $false' : 'Set-MpPreference -DisableBehaviorMonitoring $true';
    await runFireAndForget(`powershell -Command "${cmd}"`, 15000);
    return { status: 'success', message: enable ? 'تم تفعيل الحماية السلوكي' : 'تم تعطيل الحماية السلوكي' };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function startScan(type = 'quick') {
  try {
    const scanType = type === 'full' ? 'Start-MpScan -ScanType FullScan' : 'Start-MpScan -ScanType QuickScan';
    await runFireAndForget(`powershell -Command "${scanType}"`, 600000);
    return { status: 'success', message: type === 'full' ? 'اكتمل الفحص الشامل' : 'اكتمل الفحص السريع' };
  } catch (e) {
    return { status: 'failed', message: `فشل الفحص: ${e.message}` };
  }
}

async function addExclusion(path) {
  try {
    await runFireAndForget(`powershell -Command "Add-MpPreference -ExclusionPath '${path}'"`, 10000);
    return { status: 'success', message: `تمت إضافة ${path} للاستثناءات` };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function removeExclusion(path) {
  try {
    await runFireAndForget(`powershell -Command "Remove-MpPreference -ExclusionPath '${path}'"`, 10000);
    return { status: 'success', message: `تم حذف ${path} من الاستثناءات` };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function updateDefinitions() {
  try {
    await runFireAndForget('powershell -Command "Update-MpSignature"', 120000);
    return { status: 'success', message: 'تم تحديث تعريفات الفيروسات' };
  } catch (e) {
    return { status: 'failed', message: `فشل التحديث: ${e.message}` };
  }
}

module.exports = { getDefenderStatus, toggleRealtime, toggleBehavior, startScan, addExclusion, removeExclusion, updateDefinitions };
