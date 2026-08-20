const os = require('os');
const { exec } = require('child_process');

let _cachedGpu = null;
let _cachedDisk = null;
let _gpuTimer = 0;
let _diskTimer = 0;

async function getSystemInfo() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  let gpuInfo = _cachedGpu || 'N/A';
  if (!_cachedGpu && Date.now() - _gpuTimer > 10000) {
    _gpuTimer = Date.now();
    try {
      gpuInfo = await new Promise((resolve, reject) => {
        exec('powershell -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"',
          { encoding: 'utf-8', timeout: 8000 }, (err, stdout) => {
            if (err) reject(err);
            else resolve(stdout.trim().split('\n')[0] || 'N/A');
          });
      });
      _cachedGpu = gpuInfo;
    } catch (e) {}
  }

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: {
      model: cpus[0]?.model || 'Unknown',
      cores: cpus.length,
      speed: cpus[0]?.speed || 0
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      percentage: Math.round(((totalMem - freeMem) / totalMem) * 100)
    },
    gpu: gpuInfo,
    uptime: os.uptime()
  };
}

async function getLiveStats() {
  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
  }, 0) / cpus.length * 100;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;

  let diskUsage = _cachedDisk || 0;
  if (Date.now() - _diskTimer > 5000) {
    _diskTimer = Date.now();
    try {
      const diskData = await new Promise((resolve, reject) => {
        exec('powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\\" | Select-Object FreeSpace,Size | ConvertTo-Json"',
          { encoding: 'utf-8', timeout: 8000 }, (err, stdout) => {
            if (err) reject(err);
            else resolve(JSON.parse(stdout));
          });
      });
      const free = diskData.FreeSpace || 0;
      const total = diskData.Size || 1;
      diskUsage = Math.round(((total - free) / total) * 100);
      _cachedDisk = diskUsage;
    } catch (e) {}
  }

  return {
    cpu: Math.round(cpuUsage * 10) / 10,
    memory: Math.round(memUsage * 10) / 10,
    disk: diskUsage,
    memoryUsed: formatBytes(totalMem - freeMem),
    memoryTotal: formatBytes(totalMem)
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { getSystemInfo, getLiveStats };
