const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}
function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

async function getGPUInfo() {
  try {
    const output = await runCmd('powershell -Command "Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, VideoProcessor, CurrentHorizontalResolution, CurrentVerticalResolution, CurrentRefreshRate | ConvertTo-Json -Compress"');
    const gpus = JSON.parse(output);
    return (Array.isArray(gpus) ? gpus : [gpus]).map(g => ({
      name: g.Name || 'Unknown',
      memory: g.AdapterRAM ? Math.round(g.AdapterRAM / 1024 / 1024) : 0,
      driverVersion: g.DriverVersion || 'Unknown',
      processor: g.VideoProcessor || 'Unknown',
      resolution: `${g.CurrentHorizontalResolution}x${g.CurrentVerticalResolution}`,
      refreshRate: g.CurrentRefreshRate || 0
    }));
  } catch (e) { return []; }
}

async function optimizeGPU() {
  const results = [];
  try {
    await runCmd('reg add "HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences" /v DirectXUserGlobalSettings /t REG_SZ /d "VRROptimizeEnable=0;SwapEffectUpgradeEnable=1;" /f');
    results.push({ name: 'تحسين DirectX', status: 'success' });
  } catch (e) { results.push({ name: 'تحسين DirectX', status: 'failed' }); }
  try {
    await runCmd('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f');
    results.push({ name: 'تفعيل Hardware Accelerated GPU Scheduling', status: 'success' });
  } catch (e) { results.push({ name: 'GPU Scheduling', status: 'failed' }); }
  try {
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "GPU Priority" /t REG_DWORD /d 8 /f');
    results.push({ name: 'رفع أولوية GPU للألعاب', status: 'success' });
  } catch (e) { results.push({ name: 'GPU Priority', status: 'failed' }); }
  try {
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "NetworkThrottlingIndex" /t REG_DWORD /d 0xffffffff /f');
    results.push({ name: 'تعطيل Throttling', status: 'success' });
  } catch (e) { results.push({ name: 'Throttling', status: 'failed' }); }
  return results;
}

async function revertGPU() {
  const results = [];
  try {
    await runCmd('reg delete "HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences" /v DirectXUserGlobalSettings /f 2>nul');
    results.push({ name: 'إعادة DirectX', status: 'success' });
  } catch (e) { results.push({ name: 'إعادة DirectX', status: 'failed' }); }
  return results;
}

module.exports = { getGPUInfo, optimizeGPU, revertGPU };
