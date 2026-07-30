const path = require('path');
const si = require('systeminformation');

let overlayWindow = null;
let updateInterval = null;
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 0;

function getOverlayPath() {
  return path.join(__dirname, '..', '..', 'renderer', 'fps-overlay.html');
}

function calculateFps() {
  frameCount++;
  const now = Date.now();
  const diff = now - lastFpsTime;
  if (diff >= 1000) {
    currentFps = Math.round((frameCount / diff) * 1000);
    frameCount = 0;
    lastFpsTime = now;
  }
  return currentFps;
}

async function getPerformanceData() {
  try {
    const [load, mem, gpu] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.graphics()
    ]);
    return {
      cpu: Math.round(load.currentLoad),
      ram: Math.round(((mem.total - mem.free) / mem.total) * 100),
      gpu: gpu.controllers.length > 0 ? Math.min(100, Math.round(load.currentLoad)) : 0
    };
  } catch (e) {
    return { cpu: 0, ram: 0, gpu: 0 };
  }
}

async function sendUpdate() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  try {
    const data = await getPerformanceData();
    const fps = calculateFps();
    overlayWindow.webContents.send('fps-overlay-data', {
      fps,
      cpu: data.cpu,
      ram: data.ram,
      gpu: data.gpu,
      ping: 0
    });
  } catch (e) {}
}

function startOverlay(win) {
  if (overlayWindow && !overlayWindow.isDestroyed()) return { status: 'already_running' };
  const { BrowserWindow } = require('electron');
  overlayWindow = new BrowserWindow({
    width: 260,
    height: 170,
    x: win ? win.getPosition()[0] + 20 : 100,
    y: win ? win.getPosition()[1] + 20 : 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    type: 'toolbar',
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  overlayWindow.loadFile(getOverlayPath());
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.once('ready-to-show', () => overlayWindow.show());
  overlayWindow.on('closed', () => { overlayWindow = null; stopOverlay(); });
  lastFpsTime = Date.now();
  frameCount = 0;
  updateInterval = setInterval(sendUpdate, 2000);
  return { status: 'started' };
}

function stopOverlay() {
  if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
  if (overlayWindow) {
    try { if (!overlayWindow.isDestroyed()) overlayWindow.close(); } catch (e) {}
    overlayWindow = null;
  }
}

function isOverlayRunning() {
  return overlayWindow !== null && !overlayWindow.isDestroyed();
}

function toggleMousePassthrough(passthrough) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(passthrough);
  }
}

module.exports = { startOverlay, stopOverlay, isOverlayRunning, toggleMousePassthrough };
