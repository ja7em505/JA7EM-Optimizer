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

async function getRestorePoints() {
  const points = [];

  try {
    const output = await runPs('powershell -Command "Get-ComputerRestorePoint | Select-Object SequenceNumber,CreationTime,Description,RestorePointType | ConvertTo-Json"', 15000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const rp of arr) {
      points.push({
        id: rp.SequenceNumber,
        date: rp.CreationTime,
        description: rp.Description || 'بدون وصف',
        type: rp.RestorePointType === 0 ? 'إطلاق نظام' : rp.RestorePointType === 1 ? 'تثبيت تعريف' : rp.RestorePointType === 2 ? 'تثبيت برنامج' : rp.RestorePointType === 12 ? 'تطبيق غير مُعدّل' : 'غير معروف'
      });
    }
  } catch (e) { }

  return points;
}

async function createRestorePoint(description = 'JA7EM Restore Point') {
  try {
    try {
      await runFireAndForget('powershell -Command "Enable-ComputerRestore -Drive \\"C:\\"" 2>$null', 10000);
    } catch (e) { }

    try {
      await runFireAndForget('powershell -Command "Checkpoint-Computer -Description \'' + description + '\' -RestorePointType MODIFY_SETTINGS"', 60000);
      return { status: 'success', message: `تم إنشاء نقطة الاستعادة: ${description}` };
    } catch (e) {
      if (e.message && e.message.includes('15 minutes')) {
        return { status: 'failed', message: 'يجب الانتظار 15 دقيقة بين نقاط الاستعادة' };
      }
      throw e;
    }
  } catch (e) {
    return { status: 'failed', message: `فشل إنشاء نقطة الاستعادة: ${e.message}` };
  }
}

async function restoreToPoint(sequenceNumber) {
  try {
    await runFireAndForget(`powershell -Command "Restore-Computer -RestorePoint ${sequenceNumber} -Confirm:\$false"`, 60000);
    return { status: 'success', message: 'تم بدء عملية الاستعادة - الجهاز سيُعاد تشغيله' };
  } catch (e) {
    return { status: 'failed', message: `فشل الاستعادة: ${e.message}` };
  }
}

async function getRestoreStatus() {
  try {
    const output = await runPs('powershell -Command "Get-ComputerRestoreStatus | Select-Object -ExpandProperty RestorationStatus"', 10000);
    return { enabled: output.trim().toLowerCase().includes('enabled') || output.trim().toLowerCase().includes('true') };
  } catch (e) {
    return { enabled: false };
  }
}

async function enableRestore(drive = 'C:') {
  try {
    await runFireAndForget(`powershell -Command "Enable-ComputerRestore -Drive \\"${drive}:\\""`, 15000);
    return { status: 'success', message: `تم تفعيل نقطة الاستعادة على القرص ${drive}` };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

module.exports = { getRestorePoints, createRestorePoint, restoreToPoint, getRestoreStatus, enableRestore };
