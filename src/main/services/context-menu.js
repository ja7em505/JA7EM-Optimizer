const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}

async function getContextMenus() {
  try {
    const output = await runCmd('reg query "HKCR\\Directory\\Background\\shell" 2>nul');
    const items = [];
    const lines = output.split('\n').filter(l => l.trim() && !l.includes('HKEY_'));
    for (const line of lines) {
      const match = line.match(/\\([^\\]+)\s/);
      if (match) {
        const name = match[1].trim();
        let command = '';
        try {
          const cmdOutput = await runCmd(`reg query "HKCR\\Directory\\Background\\shell\\${name}\\command" /ve 2>nul`);
          const cmdMatch = cmdOutput.match(/REG_SZ\s+(.+)/);
          command = cmdMatch ? cmdMatch[1].trim() : '';
        } catch (e) {}
        items.push({ name, path: `HKCR\\Directory\\Background\\shell\\${name}`, command, type: 'background' });
      }
    }
    return items;
  } catch (e) { return []; }
}

async function removeContextMenu(path) {
  try {
    await runCmd(`reg delete "${path}" /f`);
    return { success: true, message: `Removed: ${path}` };
  } catch (e) { return { success: false, message: e.message }; }
}

async function addContextMenu(name, command) {
  try {
    await runCmd(`reg add "HKCR\\Directory\\Background\\shell\\${name}" /ve /t REG_SZ /d "${name}" /f`);
    await runCmd(`reg add "HKCR\\Directory\\Background\\shell\\${name}\\command" /ve /t REG_SZ /d "${command}" /f`);
    return { success: true, message: `Added: ${name}` };
  } catch (e) { return { success: false, message: e.message }; }
}

module.exports = { getContextMenus, removeContextMenu, addContextMenu };
