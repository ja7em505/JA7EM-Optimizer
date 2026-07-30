const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function findDuplicates(directories = null) {
  const duplicates = [];
  const scanned = 0;

  const searchDirs = directories || [
    path.join(process.env.USERPROFILE, 'Documents'),
    path.join(process.env.USERPROFILE, 'Downloads'),
    path.join(process.env.USERPROFILE, 'Pictures'),
    path.join(process.env.USERPROFILE, 'Desktop')
  ];

  const fileMap = {};

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      scanDirectory(dir, fileMap, 0);
    } catch (e) { }
  }

  for (const [size, files] of Object.entries(fileMap)) {
    if (files.length < 2) continue;

    const hashGroups = {};
    for (const file of files) {
      try {
        const hash = computeQuickHash(file);
        if (!hashGroups[hash]) hashGroups[hash] = [];
        hashGroups[hash].push(file);
      } catch (e) { }
    }

    for (const [hash, hashFiles] of Object.entries(hashGroups)) {
      if (hashFiles.length < 2) continue;
      duplicates.push({
        size: formatSize(parseInt(size)),
        sizeBytes: parseInt(size),
        files: hashFiles.map(f => ({
          path: f,
          name: path.basename(f),
          folder: path.dirname(f)
        })),
        count: hashFiles.length
      });
    }
  }

  duplicates.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const totalWasted = duplicates.reduce((sum, group) => sum + group.sizeBytes * (group.count - 1), 0);

  return {
    duplicates,
    totalGroups: duplicates.length,
    totalFiles: duplicates.reduce((sum, g) => sum + g.count, 0),
    wastedSpace: formatSize(totalWasted)
  };
}

function scanDirectory(dir, fileMap, depth) {
  if (depth > 5) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(dir, entry.name);
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > 0 && stats.size < 100 * 1024 * 1024) {
            const size = stats.size.toString();
            if (!fileMap[size]) fileMap[size] = [];
            fileMap[size].push(filePath);
          }
        } catch (e) { }
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        scanDirectory(path.join(dir, entry.name), fileMap, depth + 1);
      }
    }
  } catch (e) { }
}

function computeQuickHash(filePath) {
  const buffer = Buffer.alloc(16384);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, buffer, 0, 16384, 0);
    return crypto.createHash('md5').update(buffer.slice(0, bytesRead)).digest('hex');
  } finally {
    fs.closeSync(fd);
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function deleteDuplicateFiles(filesToKeep, filesToDelete) {
  let deleted = 0;
  let failed = 0;

  for (const file of filesToDelete) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        deleted++;
      }
    } catch (e) {
      failed++;
    }
  }

  return { deleted, failed, message: `تم حذف ${deleted} ملف${failed > 0 ? ` (${failed} فشل)` : ''}` };
}

module.exports = { findDuplicates, deleteDuplicateFiles };
