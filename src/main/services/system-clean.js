const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

async function cleanAll() {
  const results = [];

  try {
    const tempPaths = [
      process.env.TEMP,
      process.env.WINDIR + '\\Temp'
    ];

    let tempFiles = 0;
    for (const tempPath of tempPaths) {
      if (fs.existsSync(tempPath)) {
        const files = fs.readdirSync(tempPath);
        for (const file of files) {
          try {
            const filePath = path.join(tempPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              fs.unlinkSync(filePath);
              tempFiles++;
            }
          } catch (e) {}
        }
      }
    }
    results.push({ task: 'حذف الملفات المؤقتة', status: 'success', count: tempFiles });
  } catch (error) {
    results.push({ task: 'حذف الملفات المؤقتة', status: 'failed' });
  }

  try {
    await runFireAndForget('ipconfig /flushdns');
    results.push({ task: 'تنظيف DNS Cache', status: 'success' });
  } catch (error) {
    results.push({ task: 'تنظيف DNS Cache', status: 'failed' });
  }

  try {
    await runFireAndForget('del /q/f/s %TEMP%\\*');
    results.push({ task: 'تنظيف ملفات المستخدم المؤقتة', status: 'success' });
  } catch (error) {
    results.push({ task: 'تنظيف ملفات المستخدم المؤقتة', status: 'failed' });
  }

  try {
    await runFireAndForget('cleanmgr /sagerun:1');
    results.push({ task: 'تنظيف القرص', status: 'success' });
  } catch (error) {
    results.push({ task: 'تنظيف القرص', status: 'failed' });
  }

  return results;
}

async function createRestorePoint() {
  try {
    await runFireAndForget(
      'powershell -Command "Checkpoint-Computer -Description \'JA7EM Optimizer Backup\' -RestorePointType MODIFY_SETTINGS"',
      120000
    );
    return { status: 'success', message: 'تم إنشاء نقطة استعادة بنجاح' };
  } catch (error) {
    return { status: 'failed', message: 'فشل إنشاء نقطة الاستعادة' };
  }
}

async function toggleService(serviceName, enable) {
  try {
    const action = enable ? 'start= auto' : 'disabled';
    await runFireAndForget(`sc config "${serviceName}" start= ${action}`);
    if (enable) {
      await runFireAndForget(`sc start "${serviceName}"`);
    } else {
      await runFireAndForget(`sc stop "${serviceName}"`);
    }
    return { status: 'success', message: `تم ${enable ? 'تفعيل' : 'تعطيل'} الخدمة` };
  } catch (error) {
    return { status: 'failed', message: 'فشل تغيير حالة الخدمة' };
  }
}

module.exports = { cleanAll, createRestorePoint, toggleService };
