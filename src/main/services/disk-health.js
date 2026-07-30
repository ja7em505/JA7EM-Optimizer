const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getDiskHealth() {
  const results = [];
  try {
    const disks = await runPs('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName,Size,HealthStatus,OperationalStatus,MediaType | ConvertTo-Json"');
    const parsed = JSON.parse(disks);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const disk of arr) {
      results.push({
        name: disk.FriendlyName || 'Unknown',
        size: disk.Size ? Math.round(disk.Size / 1073741824) + ' GB' : 'Unknown',
        health: disk.HealthStatus || 'Unknown',
        status: disk.OperationalStatus || 'Unknown',
        type: disk.MediaType || 'Unknown'
      });
    }
  } catch (e) { }
  return results;
}

async function checkDiskErrors(drive = 'C:') {
  const results = [];
  try {
    await runPs(`chkdsk ${drive} /F /R 2>&1`, 600000);
    results.push({ name: `فحص ${drive} وإصلاح الأخطاء`, status: 'success' });
  } catch (e) {
    results.push({ name: `فحص ${drive} وإصلاح الأخطاء`, status: 'failed' });
  }
  return results;
}

async function getDiskUsage() {
  const results = [];
  try {
    const output = await runPs('powershell -Command "Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null } | Select-Object Name,@{N=\'Used\';E={[math]::Round($_.Used/1GB,2)}},@{N=\'Free\';E={[math]::Round($_.Free/1GB,2)}},@{N=\'Total\';E={[math]::Round(($_.Used+$_.Free)/1GB,2)}},@{N=\'Percent\';E={[math]::Round(($_.Used/($_.Used+$_.Free))*100,1)}} | ConvertTo-Json"');
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const vol of arr) {
      results.push({
        drive: vol.Name + ':',
        used: vol.Used,
        free: vol.Free,
        total: vol.Total,
        percent: vol.Percent
      });
    }
  } catch (e) { }
  return results;
}

async function getSMART(drive = 'C:') {
  const results = [];
  try {
    const output = await runPs('powershell -Command "Get-Disk | Get-StorageReliabilityIndicator | Select-Object Temperature,Health,ReadErrorsTotal,WriteErrorsTotal,Wear | ConvertTo-Json"');
    const data = JSON.parse(output);
    results.push({
      name: 'Smart Data',
      temperature: data.Temperature || 'N/A',
      health: data.Health || 'Good',
      readErrors: data.ReadErrorsTotal || 0,
      writeErrors: data.WriteErrorsTotal || 0,
      wear: data.Wear || 0
    });
  } catch (e) {
    results.push({ name: 'Smart Data', health: 'N/A', temperature: 'N/A' });
  }
  return results;
}

module.exports = { getDiskHealth, checkDiskErrors, getDiskUsage, getSMART };
