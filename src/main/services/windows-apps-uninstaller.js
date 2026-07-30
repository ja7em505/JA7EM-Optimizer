const { exec } = require('child_process');
const { promisify } = require('util');
const execP = promisify(exec);

async function getAllStoreApps() {
  try {
    const { stdout } = await execP('powershell -NoProfile -Command "Get-AppxPackage | Select-Object Name, PackageFullName, Publisher, InstallLocation, @{N=\'SizeMB\';E={try{(Get-ChildItem $_.InstallLocation -Recurse -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum/1MB -as [int]}catch{0}}}, @{N=\'InstallDate\';E={[DateTime]::Now}} | ConvertTo-Json -Compress"', { timeout: 30000, encoding: 'utf8' });
    const packages = JSON.parse(stdout.trim());
    const arr = Array.isArray(packages) ? packages : (packages ? [packages] : []);
    return arr.map(p => ({
      name: p.Name || 'غير معروف',
      fullName: p.PackageFullName || '',
      publisher: p.Publisher || '',
      sizeMB: p.SizeMB || 0,
      installDate: p.InstallDate || ''
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    return [];
  }
}

async function getAllProvisionedApps() {
  try {
    const { stdout } = await execP('powershell -NoProfile -Command "Get-AppxProvisionedPackage -Online | Select-Object DisplayName, PackageName | ConvertTo-Json -Compress"', { timeout: 20000, encoding: 'utf8' });
    const packages = JSON.parse(stdout.trim());
    const arr = Array.isArray(packages) ? packages : (packages ? [packages] : []);
    return arr.map(p => ({
      name: p.DisplayName || 'غير معروف',
      packageName: p.PackageName || ''
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    return [];
  }
}

async function removeStoreApp(fullName) {
  try {
    await execP(`powershell -NoProfile -Command "Remove-AppxPackage \\"${fullName}\\""`, { timeout: 60000 });
    return { status: 'success', detail: 'تمت الإزالة' };
  } catch (e) {
    try {
      await execP(`powershell -NoProfile -Command "Remove-AppxProvisionedPackage -Online -PackageName \\"${fullName}\\""`, { timeout: 60000 });
      return { status: 'success', detail: 'تمت الإزالة (Provisioned)' };
    } catch (e2) {
      return { status: 'failed', detail: e2.message };
    }
  }
}

async function removeProvisionedApp(packageName) {
  try {
    await execP(`powershell -NoProfile -Command "Remove-AppxProvisionedPackage -Online -PackageName \\"${packageName}\\""`, { timeout: 60000 });
    return { status: 'success', detail: 'تمت إزالة الحزمة' };
  } catch (e) {
    return { status: 'failed', detail: e.message };
  }
}

async function removeMultipleStoreApps(apps) {
  const results = [];
  for (const app of apps) {
    const r = await removeStoreApp(app.fullName);
    results.push({ name: app.name, ...r });
  }
  return results;
}

module.exports = { getAllStoreApps, getAllProvisionedApps, removeStoreApp, removeProvisionedApp, removeMultipleStoreApps };
