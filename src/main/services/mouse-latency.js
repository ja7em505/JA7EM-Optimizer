const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}

async function getMouseSettings() {
  try {
    const speed = await runCmd('reg query "HKCU\\Control Panel\\Mouse" /v MouseSpeed 2>nul');
    const threshold1 = await runCmd('reg query "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 2>nul');
    const threshold2 = await runCmd('reg query "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 2>nul');
    return {
      speed: speed.includes('0') ? '0' : '1',
      enhanced: true,
      pollingRate: 'Unknown'
    };
  } catch (e) { return { speed: '1', enhanced: true, pollingRate: 'Unknown' }; }
}

async function optimizeMouse() {
  const results = [];
  try {
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f');
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "0" /f');
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "0" /f');
    results.push({ name: 'تعطيل Mouse Acceleration', status: 'success' });
  } catch (e) { results.push({ name: 'Mouse Acceleration', status: 'failed' }); }
  try {
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d "10" /f');
    results.push({ name: 'ضبط الحساسية', status: 'success' });
  } catch (e) { results.push({ name: 'Mouse Sensitivity', status: 'failed' }); }
  try {
    await runCmd('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters" /v MouseDataQueueSize /t REG_DWORD /d 16 /f');
    results.push({ name: 'تقليل Mouse Buffer Size', status: 'success' });
  } catch (e) { results.push({ name: 'Mouse Buffer', status: 'failed' }); }
  try {
    await runCmd('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters" /v MouseQueueSize /t REG_DWORD /d 20 /f');
    results.push({ name: 'تحسين Mouse Queue', status: 'success' });
  } catch (e) { results.push({ name: 'Mouse Queue', status: 'failed' }); }
  return results;
}

async function revertMouse() {
  const results = [];
  try {
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "1" /f');
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "6" /f');
    await runCmd('reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "10" /f');
    results.push({ name: 'إعادة Mouse Settings', status: 'success' });
  } catch (e) { results.push({ name: 'Mouse Settings', status: 'failed' }); }
  return results;
}

module.exports = { getMouseSettings, optimizeMouse, revertMouse };
