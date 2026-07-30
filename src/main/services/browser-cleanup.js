const fs = require('fs');
const path = require('path');

function getSize(dir) {
  try {
    let total = 0;
    if (!fs.existsSync(dir)) return 0;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) total += getSize(full);
        else total += stat.size;
      } catch (e) {}
    }
    return total;
  } catch (e) { return 0; }
}

function deleteDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (e) { return false; }
}

const browsers = [
  {
    id: 'chrome', name: 'Google Chrome',
    cache: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    cache2: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
    cookies: path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Cookies'),
  },
  {
    id: 'firefox', name: 'Mozilla Firefox',
    cache: path.join(process.env.LOCALAPPDATA, 'Mozilla', 'Firefox', 'Profiles'),
  },
  {
    id: 'edge', name: 'Microsoft Edge',
    cache: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
    cache2: path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'),
  },
  {
    id: 'brave', name: 'Brave Browser',
    cache: path.join(process.env.LOCALAPPDATA, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Cache'),
  },
  {
    id: 'opera', name: 'Opera',
    cache: path.join(process.env.APPDATA, 'Opera Software', 'Opera Stable', 'Cache'),
  },
  {
    id: 'vivaldi', name: 'Vivaldi',
    cache: path.join(process.env.LOCALAPPDATA, 'Vivaldi', 'User Data', 'Default', 'Cache'),
  }
];

async function getBrowserSizes() {
  const result = [];
  for (const browser of browsers) {
    let totalSize = 0;
    const dirs = [browser.cache, browser.cache2].filter(Boolean);
    for (const dir of dirs) {
      totalSize += getSize(dir);
    }
    result.push({
      id: browser.id,
      name: browser.name,
      sizeMB: Math.round(totalSize / 1024 / 1024),
      cachePath: browser.cache
    });
  }
  return result;
}

async function cleanBrowser(browserId) {
  const browser = browsers.find(b => b.id === browserId);
  if (!browser) return { success: false, message: 'Browser not found' };
  let cleaned = 0;
  const dirs = [browser.cache, browser.cache2].filter(Boolean);
  for (const dir of dirs) {
    if (deleteDir(dir)) cleaned++;
  }
  return { success: cleaned > 0, message: `Cleaned ${browser.name} cache` };
}

async function cleanAllBrowsers() {
  const results = [];
  for (const browser of browsers) {
    const r = await cleanBrowser(browser.id);
    results.push({ name: browser.name, status: r.success ? 'success' : 'failed' });
  }
  return results;
}

module.exports = { getBrowserSizes, cleanBrowser, cleanAllBrowsers };
