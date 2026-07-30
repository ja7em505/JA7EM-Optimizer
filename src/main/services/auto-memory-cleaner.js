const { exec } = require('child_process');
const { BrowserWindow } = require('electron');
const si = require('systeminformation');

let cleanInterval = null;
let isRunning = false;
let intervalMs = 30000;
let targetWindow = null;

function emptyWorkingSets() {
  return new Promise((resolve) => {
    exec('powershell -NoProfile -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers(); (Get-Process).Where({$_.WorkingSet64 -gt 10MB -and $_.MainWindowTitle -ne \"\"}) | ForEach-Object { try { [System.Diagnostics.Process]::GetProcessById($_.Id).MinWorkingSet = [IntPtr]::new(1024*1024) } catch {} }"', { timeout: 15000 }, () => resolve());
  });
}

function clearStandbyList() {
  return new Promise((resolve) => {
    exec('powershell -NoProfile -Command "[System.Runtime.InteropServices.Marshal]::WriteInt32([System.Runtime.InteropServices.Marshal]::AllocHGlobal(4), 0)" 2>$null; powershell -NoProfile -Command "foreach ($p in (Get-Process -ErrorAction SilentlyContinue)) { try { $p.Refresh() } catch {} }"', { timeout: 10000 }, () => resolve());
  });
}

async function getMemoryStatus() {
  try {
    const mem = await si.mem();
    const totalMB = Math.round(mem.total / 1024 / 1024);
    const usedMB = Math.round(mem.used / 1024 / 1024);
    const freeMB = Math.round(mem.free / 1024 / 1024);
    const usagePct = Math.round((mem.used / mem.total) * 100);
    return { totalMB, usedMB, freeMB, usagePct };
  } catch {
    return null;
  }
}

async function cleanOnce() {
  try {
    await emptyWorkingSets();
    await clearStandbyList();
    return await getMemoryStatus();
  } catch {
    return null;
  }
}

function sendToRenderer(data) {
  try {
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('auto-clean-update', data);
    }
  } catch (e) {}
}

async function startAutoClean(ms, win) {
  if (isRunning) return { status: 'already_running' };
  isRunning = true;
  intervalMs = ms || 30000;
  targetWindow = win;
  sendToRenderer({ status: 'started', interval: intervalMs });
  const tick = async () => {
    if (!isRunning) return;
    const result = await cleanOnce();
    if (result) sendToRenderer({ status: 'tick', memory: result });
    if (isRunning) cleanInterval = setTimeout(tick, intervalMs);
  };
  await tick();
  return { status: 'started' };
}

function stopAutoClean() {
  isRunning = false;
  if (cleanInterval) { clearTimeout(cleanInterval); cleanInterval = null; }
  sendToRenderer({ status: 'stopped' });
  targetWindow = null;
}

function isAutoCleanRunning() {
  return isRunning;
}

module.exports = { getMemoryStatus, cleanOnce, startAutoClean, stopAutoClean, isAutoCleanRunning };
