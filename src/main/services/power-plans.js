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

async function getPowerPlans() {
  const plans = [];

  try {
    const output = await runPs('powercfg /list', 10000);
    const lines = output.split('\n');
    let current = null;
    for (const line of lines) {
      if (line.includes('Power Scheme GUID')) {
        const match = line.match(/Power Scheme GUID:\s*([^\s]+)\s+(.+?)(?:\s+\(.*\))?$/);
        if (match) {
          const isActive = line.includes('*');
          plans.push({
            guid: match[1],
            name: match[2].trim(),
            active: isActive
          });
        }
      }
    }
  } catch (e) { }

  return plans;
}

async function setActivePlan(guid) {
  try {
    await runFireAndForget(`powercfg /setactive ${guid}`, 10000);
    return { status: 'success', message: 'تم تفعيل خطة الطاقة' };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function createGamingPlan() {
  try {
    const balancedGuid = '381b4222-f694-41f0-9685-ff5bb260df2e';
    try {
      await runFireAndForget(`powercfg /duplicatescheme ${balancedGuid}`, 10000);
    } catch (e) { }

    let newGuid = null;
    const output = await runPs('powercfg /list', 10000);
    const lines = output.split('\n').reverse();
    for (const line of lines) {
      if (line.includes('Power Scheme GUID') && line.includes('Untitled')) {
        const match = line.match(/Power Scheme GUID:\s*([^\s]+)/);
        if (match) { newGuid = match[1]; break; }
      }
    }

    if (!newGuid) {
      const allLines = output.split('\n');
      for (const line of allLines) {
        if (line.includes('Power Scheme GUID')) {
          const match = line.match(/Power Scheme GUID:\s*([^\s]+)/);
          if (match) { newGuid = match[1]; }
        }
      }
    }

    if (newGuid) {
      await runFireAndForget(`powercfg /changename ${newGuid} "CJ Gaming" "خطة ألعاب - أقصى أداء"`, 10000);

      const settings = [
        'SUB_PROCESSOR PROCTHROTTLEMIN 100',
        'SUB_PROCESSOR PROCTHROTTLEMAX 100',
        'SUB_PROCESSOR PERFBOOSTMODE 2',
        'SUB_PROCESSOR PERFBOOSTPOL 100',
        'SUB_PROCESSOR COREPARKINGMAX 100',
        'SUB_PROCESSOR COREPARKINGMIN 100',
        'SUB_SLEEP STANDBYIDLE 0',
        'SUB_SLEEP HYBRIDSLEEP 0',
        'SUB_SLEEP HIBERNATEIDLE 0',
        'SUB_DISK IDLEDEACT 0',
        'SUB_VIDEO VIDEOIDLE 0',
        'SUB_VIDEO VIDEOCONLOCK 0'
      ];

      for (const setting of settings) {
        try {
          await runFireAndForget(`powercfg /setacvalueindex ${newGuid} ${setting}`, 5000);
        } catch (e) { }
      }

      await runFireAndForget(`powercfg /setactive ${newGuid}`, 10000);

      return { status: 'success', message: 'تم إنشاء وتفعيل خطة CJ Gaming', guid: newGuid };
    }

    return { status: 'failed', message: 'فشل إنشاء الخطة' };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function createPowerSaverPlan() {
  try {
    const output = await runPs('powercfg /list', 10000);
    const saverMatch = output.match(/Power Scheme GUID:\s*([^\s]+)\s+a184-.*?Toshiba/);

    const existing = output.split('\n').find(l => l.includes('Power Saver') || l.includes('وفير'));
    if (existing) {
      const match = existing.match(/Power Scheme GUID:\s*([^\s]+)/);
      if (match) {
        await runFireAndForget(`powercfg /setactive ${match[1]}`, 10000);
        return { status: 'success', message: 'تم تفعيل وضع توفير الطاقة' };
      }
    }

    const saverGuid = 'a1841308-3541-4fab-bc81-f71556f20b4a';
    try {
      await runFireAndForget(`powercfg /setactive ${saverGuid}`, 10000);
      return { status: 'success', message: 'تم تفعيل وضع توفير الطاقة' };
    } catch (e) { }

    return { status: 'failed', message: 'لم يتم العثور على خطة توفير الطاقة' };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

module.exports = { getPowerPlans, setActivePlan, createGamingPlan, createPowerSaverPlan };
