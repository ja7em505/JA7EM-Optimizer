const { exec } = require('child_process');
const os = require('os');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getSystemInfo() {
  const info = {
    os: {},
    cpu: {},
    memory: {},
    gpu: [],
    motherboard: {},
    bios: {},
    storage: [],
    network: []
  };

  // OS
  info.os = {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime: formatUptime(os.uptime())
  };

  // CPU
  const cpus = os.cpus();
  info.cpu = {
    model: cpus[0] ? cpus[0].model : 'Unknown',
    cores: cpus.length,
    speed: cpus[0] ? cpus[0].speed : 0
  };

  // Memory
  info.memory = {
    total: formatBytes(os.totalmem()),
    free: formatBytes(os.freemem()),
    used: formatBytes(os.totalmem() - os.freemem()),
    percentage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
  };

  // GPU
  try {
    const output = await runPs('powershell -Command "Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion,VideoModeDescription | ConvertTo-Json"', 10000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    info.gpu = arr.map(g => ({
      name: g.Name,
      memory: g.AdapterRAM ? formatBytes(g.AdapterRAM) : 'N/A',
      driver: g.DriverVersion || 'N/A',
      mode: g.VideoModeDescription || 'N/A'
    }));
  } catch (e) { }

  // Motherboard
  try {
    const output = await runPs('powershell -Command "Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer,Product,SerialNumber | ConvertTo-Json"', 10000);
    const data = JSON.parse(output);
    info.motherboard = {
      manufacturer: data.Manufacturer || 'Unknown',
      product: data.Product || 'Unknown',
      serial: data.SerialNumber || 'N/A'
    };
  } catch (e) { }

  // BIOS
  try {
    const output = await runPs('powershell -Command "Get-CimInstance Win32_BIOS | Select-Object Manufacturer,Name,Version,ReleaseDate | ConvertTo-Json"', 10000);
    const data = JSON.parse(output);
    info.bios = {
      manufacturer: data.Manufacturer || 'Unknown',
      name: data.Name || 'Unknown',
      version: data.Version || 'N/A',
      date: data.ReleaseDate || 'N/A'
    };
  } catch (e) { }

  // Storage
  try {
    const output = await runPs('powershell -Command "Get-PhysicalDisk | Select-Object FriendlyName,Size,MediaType,HealthStatus | ConvertTo-Json"', 10000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    info.storage = arr.map(d => ({
      name: d.FriendlyName,
      size: d.Size ? formatBytes(d.Size) : 'N/A',
      type: d.MediaType || 'N/A',
      health: d.HealthStatus || 'N/A'
    }));
  } catch (e) { }

  // Windows activation
  try {
    const output = await runPs('cscript //nologo "C:\\Windows\\System32\\slmgr.vbs" /dli 2>nul', 10000);
    const licenseMatch = output.match(/Licensed/i);
    info.os.activated = licenseMatch ? 'مفعّل' : 'غير مفعّل';
  } catch (e) {
    info.os.activated = 'N/A';
  }

  // Installed apps count
  try {
    const output = await runPs('powershell -Command "(Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Measure-Object).Count"', 10000);
    info.os.installedApps = parseInt(output.trim()) || 0;
  } catch (e) {
    info.os.installedApps = 0;
  }

  return info;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days} يوم ${hours} ساعة ${mins} دقيقة`;
}

module.exports = { getSystemInfo };
