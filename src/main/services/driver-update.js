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

async function getDrivers() {
  try {
    const output = await runPs(
      'powershell -Command "Get-CimInstance Win32_PnPSignedDriver | Where-Object {$_.DeviceID -ne $null} | Select-Object DeviceID,DeviceName,DriverVersion,Manufacturer | ConvertTo-Json"',
      30000
    );

    let drivers = JSON.parse(output);
    if (!Array.isArray(drivers)) drivers = [drivers];

    return drivers.map(d => ({
      deviceId: d.DeviceID || '',
      name: d.DeviceName || 'Unknown',
      version: d.DriverVersion || 'N/A',
      manufacturer: d.Manufacturer || 'Unknown'
    }));
  } catch (error) {
    return [];
  }
}

async function updateDriver(deviceId) {
  try {
    if (deviceId) {
      await runFireAndForget(`pnputil /enum-devices ${deviceId} 2>nul`, 15000);
    }
    await runFireAndForget('pnputil /scan-devices', 60000);
    return { status: 'success', message: deviceId ? `Scanned updates for ${deviceId}` : 'تم البحث عن تحديثات التعريفات' };
  } catch (e) {
    return { status: 'failed', message: 'فشل تحديث التعريف' };
  }
}

module.exports = { getDrivers, updateDriver };
