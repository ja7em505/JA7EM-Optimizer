const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function runFireAndForget(cmd, timeout = 15000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

async function getInstalledApps() {
  const apps = [];

  const registryPaths = [
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
  ];

  for (const regPath of registryPaths) {
    try {
      const output = await runPs(`powershell -Command "Get-ItemProperty '${regPath}' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -and $_.DisplayName -notmatch '^(Update|Security|KB|Microsoft Visual C\\+\\+|\\.NET|Redistributable)' } | Select-Object DisplayName,DisplayVersion,Publisher,InstallDate,EstimatedSize,UninstallString | Sort-Object DisplayName | ConvertTo-Json"`, 30000);
      const parsed = JSON.parse(output);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const app of arr) {
        if (!apps.find(a => a.name === app.DisplayName)) {
          apps.push({
            name: app.DisplayName,
            version: app.DisplayVersion || 'N/A',
            publisher: app.Publisher || 'N/A',
            installDate: app.InstallDate || 'N/A',
            size: app.EstimatedSize ? Math.round(app.EstimatedSize / 1024) + ' MB' : 'N/A',
            uninstallString: app.UninstallString || ''
          });
        }
      }
    } catch (e) { }
  }

  return apps;
}

async function uninstallApp(name, uninstallString) {
  return new Promise((resolve) => {
    try {
      if (uninstallString && uninstallString.trim()) {
        let cmd = uninstallString.trim();

        // Remove surrounding quotes if present
        cmd = cmd.replace(/^"(.*)"$/, '$1');

        if (cmd.toLowerCase().includes('msiexec')) {
          // MSI uninstall - replace /x with /X and add /qb for progress UI
          cmd = cmd.replace(/\/x/i, '/X');
          if (!cmd.includes('/qb') && !cmd.includes('/qn')) {
            cmd = cmd + ' /qb';
          }
        } else {
          // Non-MSI: try running with /S (silent) first, then without
          // Most uninstallers accept /S for silent mode
          if (!cmd.includes('/S') && !cmd.includes('/s')) {
            cmd = cmd + ' /S';
          }
        }

        const child = exec(cmd, { timeout: 120000, windowsHide: false }, (error, stdout, stderr) => {
          if (error) {
            // If silent mode failed, try running interactively
            if (cmd.includes('/S') || cmd.includes('/s')) {
              const interactiveCmd = cmd.replace(/\/S/gi, '').replace(/\/s/gi, '').trim();
              const child2 = exec(interactiveCmd, { timeout: 120000, windowsHide: false }, (error2) => {
                if (error2) {
                  // Last resort: try wmic
                  exec(`wmic product where name="${name}" call uninstall`, { timeout: 120000, windowsHide: false }, (err3) => {
                    if (err3) {
                      resolve({ status: 'failed', message: `فشل إزالة ${name}: ${error.message}` });
                    } else {
                      resolve({ status: 'success', message: `تم بدء إزالة ${name}` });
                    }
                  });
                } else {
                  resolve({ status: 'success', message: `تم بدء إزالة ${name}` });
                }
              });
            } else {
              resolve({ status: 'failed', message: `فشل إزالة ${name}: ${error.message}` });
            }
          } else {
            resolve({ status: 'success', message: `تم إزالة ${name} بنجاح` });
          }
        });
      } else {
        // No uninstall string - try wmic
        const wmicCmd = `wmic product where name="${name}" call uninstall`;
        exec(wmicCmd, { timeout: 120000, windowsHide: false }, (error) => {
          if (error) {
            // Try opening Windows Settings Apps page as fallback
            exec('ms-settings:appsfeatures', { timeout: 5000, windowsHide: false }, () => {
              resolve({ status: 'success', message: `تم فتح إعدادات التطبيقات — يدوياً لإزالة ${name}` });
            });
          } else {
            resolve({ status: 'success', message: `تم إزالة ${name} بنجاح` });
          }
        });
      }
    } catch (e) {
      resolve({ status: 'failed', message: `فشل إزالة ${name}: ${e.message}` });
    }
  });
}

module.exports = { getInstalledApps, uninstallApp };
