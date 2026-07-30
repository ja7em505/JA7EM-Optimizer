const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function analyzeDirectory(dirPath) {
  const result = {
    path: dirPath,
    name: path.basename(dirPath) || dirPath,
    size: 0,
    children: [],
    files: []
  };

  try {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fsp.stat(fullPath);
        if (entry.isDirectory()) {
          items.push({ name: entry.name, path: fullPath, isDir: true, size: 0 });
        } else {
          items.push({ name: entry.name, path: fullPath, isDir: false, size: stats.size });
          result.size += stats.size;
        }
      } catch (e) { }
    }

    for (const item of items) {
      if (item.isDir) {
        try { item.size = await getDirSize(item.path, 1); } catch (e) { }
        result.size += item.size;
      }
    }

    items.sort((a, b) => b.size - a.size);

    const dirs = items.filter(i => i.isDir);
    const files = items.filter(i => !i.isDir);

    result.children = dirs.map(d => ({
      name: d.name, path: d.path, size: d.size, sizeFormatted: formatSize(d.size)
    }));

    result.files = files.slice(0, 50).map(f => ({
      name: f.name, path: f.path, size: f.size, sizeFormatted: formatSize(f.size)
    }));

    result.sizeFormatted = formatSize(result.size);
  } catch (e) { }

  return result;
}

async function getDirSize(dir, depth = 0) {
  if (depth > 3) return 0;
  let total = 0;
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      try {
        const fullPath = path.join(dir, entry.name);
        const stats = await fsp.stat(fullPath);
        if (stats.isFile()) total += stats.size;
        else if (stats.isDirectory()) total += await getDirSize(fullPath, depth + 1);
      } catch (e) { }
    }
  } catch (e) { }
  return total;
}

async function getDirectoryTree(dirPath, depth = 1, maxSize = 0) {
  const result = {
    name: path.basename(dirPath) || dirPath,
    path: dirPath, size: 0, children: [], isExpanded: depth <= 1
  };
  try {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fsp.stat(fullPath);
        if (entry.isDirectory()) {
          const dirSize = await getDirSize(fullPath, 1);
          if (dirSize > maxSize) items.push({ name: entry.name, path: fullPath, isDir: true, size: dirSize });
        } else {
          items.push({ name: entry.name, path: fullPath, isDir: false, size: stats.size });
          result.size += stats.size;
        }
      } catch (e) { }
    }
    for (const item of items) if (item.isDir) result.size += item.size;
    items.sort((a, b) => b.size - a.size);
    for (const item of items) {
      if (item.isDir && depth < 4) {
        const child = await getDirectoryTree(item.path, depth + 1, Math.max(maxSize, item.size * 0.05));
        child.size = item.size;
        child.sizeFormatted = formatSize(item.size);
        result.children.push(child);
      } else {
        result.children.push({ name: item.name, path: item.path, size: item.size, sizeFormatted: formatSize(item.size), isFile: !item.isDir, children: [] });
      }
    }
  } catch (e) { }
  return result;
}

async function getTopFiles(dirPath, limit = 50) {
  const files = [];
  await scanDirectoryAsync(dirPath, files, 0, 6);
  files.sort((a, b) => b.size - a.size);
  return files.slice(0, limit).map(f => ({
    name: f.name, path: f.path, folder: path.dirname(f.path),
    size: f.size, sizeFormatted: formatSize(f.size), modified: f.modified
  }));
}

async function scanDirectoryAsync(dir, results, depth, maxDepth) {
  if (depth > maxDepth) return;
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      try {
        const stats = await fsp.stat(fullPath);
        if (entry.isFile()) {
          if (stats.size > 10 * 1024 * 1024) {
            results.push({ name: entry.name, path: fullPath, size: stats.size, modified: stats.mtime });
          }
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scanDirectoryAsync(fullPath, results, depth + 1, maxDepth);
        }
      } catch (e) { }
    }
  } catch (e) { }
}

async function getDriveOverview() {
  const drives = [];
  try {
    const output = await runPs('powershell -Command "Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -ne $null } | Select-Object Name,@{N=\'Used\';E={[math]::Round($_.Used/1GB,2)}},@{N=\'Free\';E={[math]::Round($_.Free/1GB,2)}},@{N=\'Total\';E={[math]::Round(($_.Used+$_.Free)/1GB,2)}},@{N=\'UsedBytes\';E={$_.Used}},@{N=\'FreeBytes\';E={$_.Free}} | ConvertTo-Json"');
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const vol of arr) {
      if (vol.Total > 0) {
        drives.push({
          name: vol.Name + ':', used: vol.Used, free: vol.Free, total: vol.Total,
          usedBytes: vol.UsedBytes, freeBytes: vol.FreeBytes,
          percent: Math.round((vol.Used / vol.Total) * 100)
        });
      }
    }
  } catch (e) { }
  return drives;
}

async function deleteItem(itemPath) {
  try {
    const stats = await fsp.stat(itemPath);
    if (stats.isDirectory()) {
      await fsp.rm(itemPath, { recursive: true, force: true });
    } else {
      await fsp.unlink(itemPath);
    }
    return { status: 'success', message: `تم حذف ${path.basename(itemPath)}` };
  } catch (e) {
    return { status: 'failed', message: `فشل الحذف: ${e.message}` };
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = { analyzeDirectory, getDirectoryTree, getTopFiles, getDriveOverview, deleteItem };
