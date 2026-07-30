const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

function parseWMIJson(output) {
  try {
    const trimmed = output.trim();
    if (!trimmed || trimmed === '' || trimmed === 'null') return null;
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) { return null; }
}

async function getCPUInfo() {
  const info = { name: 'Unknown', cores: 0, temp: -1, usage: -1, speed: 0 };
  try {
    const output = await runCmd('powershell -Command "Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed, LoadPercentage | ConvertTo-Json -Compress"');
    const data = parseWMIJson(output);
    if (data && data[0]) {
      info.name = data[0].Name || 'Unknown';
      info.cores = data[0].NumberOfCores || 0;
      info.speed = data[0].MaxClockSpeed || 0;
      info.usage = data[0].LoadPercentage || -1;
    }
  } catch (e) {}

  try {
    const output = await runCmd('powershell -Command "Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace \\"root/wmi\\" -ErrorAction SilentlyContinue | Select-Object -First 1 CurrentTemperature"');
    const match = output.match(/(\d+)/);
    if (match) info.temp = Math.round((parseInt(match[1]) / 10) - 273.15);
  } catch (e) {}

  if (info.temp < 0) {
    try {
      const output = await runCmd('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature /format:csv 2>nul');
      const match = output.match(/,(\d+)/);
      if (match) info.temp = Math.round((parseInt(match[1]) / 10) - 273.15);
    } catch (e) {}
  }

  return info;
}

async function getGPUInfoTemp() {
  const gpus = [];
  try {
    const nvidiaOutput = await runCmd('nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,fan.speed,power.draw --format=csv,noheader,nounits', 8000);
    if (nvidiaOutput.trim()) {
      const lines = nvidiaOutput.trim().split('\n');
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 5) {
          gpus.push({
            name: parts[0],
            temp: parseInt(parts[1]) || -1,
            usage: parseInt(parts[2]) || -1,
            memoryUsed: parseInt(parts[3]) || 0,
            memoryTotal: parseInt(parts[4]) || 0,
            fanSpeed: parseInt(parts[5]) || -1,
            powerDraw: parseFloat(parts[6]) || -1,
            type: 'NVIDIA'
          });
        }
      }
    }
  } catch (e) {}

  if (gpus.length === 0) {
    try {
      const output = await runCmd('powershell -Command "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, AdapterDACType, VideoProcessor | ConvertTo-Json -Compress"');
      const data = parseWMIJson(output);
      if (data) {
        for (const g of data) {
          gpus.push({
            name: g.Name || 'Unknown GPU',
            temp: -1,
            usage: -1,
            memoryUsed: 0,
            memoryTotal: g.AdapterRAM ? Math.round(g.AdapterRAM / 1024 / 1024) : 0,
            fanSpeed: -1,
            powerDraw: -1,
            type: g.AdapterDACType || 'Unknown'
          });
        }
      }
    } catch (e) {}
  }
  return gpus;
}

async function getStorageInfo() {
  const drives = [];
  try {
    const output = await runCmd('powershell -Command "Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, MediaType, Size, HealthStatus, Temperature | ConvertTo-Json -Compress"');
    const data = parseWMIJson(output);
    if (data) {
      for (const d of data) {
        drives.push({
          id: d.DeviceId || '0',
          name: d.FriendlyName || 'Unknown',
          type: d.MediaType || 'Unknown',
          size: d.Size ? Math.round(d.Size / 1024 / 1024 / 1024) : 0,
          health: d.HealthStatus || 'Unknown',
          temp: d.Temperature || -1
        });
      }
    }
  } catch (e) {}

  if (drives.length === 0) {
    try {
      const output = await runCmd('powershell -Command "Get-WmiObject Win32_DiskDrive | Select-Object DeviceID, Model, Size, MediaType | ConvertTo-Json -Compress"');
      const data = parseWMIJson(output);
      if (data) {
        for (const d of data) {
          drives.push({
            id: d.DeviceID || '0',
            name: d.Model || 'Unknown',
            type: d.MediaType || 'Unknown',
            size: d.Size ? Math.round(d.Size / 1024 / 1024 / 1024) : 0,
            health: 'Unknown',
            temp: -1
          });
        }
      }
    } catch (e) {}
  }
  return drives;
}

async function getMotherboardInfo() {
  const info = { name: 'Unknown', temp: -1 };
  try {
    const output = await runCmd('powershell -Command "Get-CimInstance Win32_BaseBoard | Select-Object Product, Manufacturer | ConvertTo-Json -Compress"');
    const data = parseWMIJson(output);
    if (data && data[0]) {
      info.name = `${data[0].Manufacturer || ''} ${data[0].Product || ''}`.trim();
    }
  } catch (e) {}

  try {
    const output = await runCmd('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature /format:csv 2>nul');
    const lines = output.trim().split('\n').filter(l => l.match(/,\d+/));
    if (lines.length > 1) {
      const match = lines[1].match(/,(\d+)/);
      if (match) info.temp = Math.round((parseInt(match[1]) / 10) - 273.15);
    }
  } catch (e) {}
  return info;
}

async function getFanSpeeds() {
  try {
    const output = await runCmd('powershell -Command "(Get-CimInstance -Namespace root/OpenHardwareMonitor -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object {$_.SensorType -eq \'Fan\'} | Select-Object Name, Value) | ConvertTo-Json -Compress"');
    const data = parseWMIJson(output);
    if (data) {
      return (Array.isArray(data) ? data : [data]).map(f => ({
        name: f.Name || 'Fan',
        rpm: Math.round(f.Value || 0)
      }));
    }
  } catch (e) {}
  return [];
}

async function getAllTemperatures() {
  const [cpu, gpus, storage, motherboard, fans] = await Promise.all([
    getCPUInfo(),
    getGPUInfoTemp(),
    getStorageInfo(),
    getMotherboardInfo(),
    getFanSpeeds()
  ]);

  const sensors = [];

  sensors.push({
    id: 'cpu',
    name: cpu.name,
    category: 'المعالج (CPU)',
    temp: cpu.temp,
    usage: cpu.usage,
    cores: cpu.cores,
    speed: cpu.speed,
    status: cpu.temp > 85 ? 'critical' : cpu.temp > 70 ? 'hot' : cpu.temp > 50 ? 'warm' : 'cool'
  });

  gpus.forEach((g, i) => {
    sensors.push({
      id: `gpu_${i}`,
      name: g.name,
      category: 'كرت الشاشة (GPU)',
      temp: g.temp,
      usage: g.usage,
      memoryUsed: g.memoryUsed,
      memoryTotal: g.memoryTotal,
      fanSpeed: g.fanSpeed,
      powerDraw: g.powerDraw,
      type: g.type,
      status: g.temp > 85 ? 'critical' : g.temp > 75 ? 'hot' : g.temp > 60 ? 'warm' : 'cool'
    });
  });

  storage.forEach((s, i) => {
    sensors.push({
      id: `storage_${i}`,
      name: s.name,
      category: 'التخزين (Storage)',
      temp: s.temp,
      size: s.size,
      health: s.health,
      status: s.temp > 55 ? 'hot' : s.temp > 40 ? 'warm' : 'cool'
    });
  });

  if (motherboard.name !== 'Unknown') {
    sensors.push({
      id: 'motherboard',
      name: motherboard.name,
      category: 'اللوحة الأم (Motherboard)',
      temp: motherboard.temp,
      status: motherboard.temp > 55 ? 'hot' : motherboard.temp > 40 ? 'warm' : 'cool'
    });
  }

  if (fans.length > 0) {
    fans.forEach((f, i) => {
      sensors.push({
        id: `fan_${i}`,
        name: f.name,
        category: 'المراوح (Fans)',
        rpm: f.rpm,
        status: 'info'
      });
    });
  }

  return { sensors, cpu, gpus, storage, motherboard, fans };
}

module.exports = { getAllTemperatures, getCPUInfo, getGPUInfoTemp, getStorageInfo, getMotherboardInfo, getFanSpeeds };
