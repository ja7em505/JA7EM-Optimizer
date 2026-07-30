const { exec } = require('child_process');

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

const SSD_TWEAKS = [
  { id: 'disableLastAccess', name: 'تعطيل Last Access Time', desc: 'يمنع تحديث وقت آخر وصول للملفات', cmd: 'fsutil behavior set disablelastaccess 1', revert: 'fsutil behavior set disablelastaccess 0' },
  { id: 'disable8dot3', name: 'تعطيل أسماء 8.3', desc: 'يمنع إنشاء أسماء DOS القديمة', cmd: 'fsutil behavior set disable8dot3 1', revert: 'fsutil behavior set disable8dot3 0' },
  { id: 'largeSystemCache', name: 'Large System Cache', desc: 'يحسن أداء التخزين المؤقت', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 1 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /f' },
  { id: 'enableWriteCaching', name: 'تفعيل Write Caching', desc: 'تسريع الكتابة على القرص', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v ForceWriteCaching /t REG_DWORD /d 0 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v ForceWriteCaching /f' },
  { id: 'disablePrefetch', name: 'تعطيل Prefetch/Superfetch', desc: 'يمنع التخزين المؤقت الزائد للأقراص SSD', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnablePrefetcher /t REG_DWORD /d 0 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnablePrefetcher /f' },
  { id: 'disableBootPrefetch', name: 'تعطيل Boot Prefetch', desc: 'تسريع الإقلاع', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnableBootPrefetcher /t REG_DWORD /d 0 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnableBootPrefetcher /f' },
  { id: 'disableIndexing', name: 'تعطيل فهرسة SSD', desc: 'يمنع Windows من فهرسة SSD لتقليل عمليات الكتابة', cmd: 'powershell -Command "Get-ChildItem -Path (Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root) -ErrorAction SilentlyContinue | Where-Object { $_.Name -match \'^[A-Z]:\\$\' } | ForEach-Object { try { Disable-WindowsOptionalFeature -Online -FeatureName SearchEngine-Client -NoRestart -ErrorAction SilentlyContinue } catch {} }"', revert: 'powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName SearchEngine-Client -NoRestart -ErrorAction SilentlyContinue"' }
];

async function getSsdTweaks() {
  return SSD_TWEAKS.map(t => ({ id: t.id, name: t.name, desc: t.desc }));
}

async function applySsdTweak(tweakId) {
  const tweak = SSD_TWEAKS.find(t => t.id === tweakId);
  if (!tweak) return { name: 'غير معروف', status: 'failed' };
  try {
    await runFire(tweak.cmd, 15000);
    return { name: tweak.name, status: 'success' };
  } catch (e) {
    return { name: tweak.name, status: 'failed', error: e.message };
  }
}

async function applyAllSsdTweaks() {
  const results = [];
  for (const tweak of SSD_TWEAKS) {
    try {
      await runFire(tweak.cmd, 15000);
      results.push({ name: tweak.name, status: 'success' });
    } catch (e) {
      results.push({ name: tweak.name, status: 'failed' });
    }
  }
  return results;
}

async function revertAllSsdTweaks() {
  const results = [];
  for (const tweak of SSD_TWEAKS) {
    try {
      await runFire(tweak.revert, 15000);
      results.push({ name: `إعادة ${tweak.name}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة ${tweak.name}`, status: 'failed' });
    }
  }
  return results;
}

module.exports = { getSsdTweaks, applySsdTweak, applyAllSsdTweaks, revertAllSsdTweaks };
