const { exec } = require('child_process');

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

const INPUT_LAG_TWEAKS = [
  { id: 'mouseAccel', name: 'تعطيل Mouse Acceleration', desc: 'إدخال خام بدون تسريع', cmd: 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Mouse" /v MouseSpeed /f' },
  { id: 'mouseThreshold1', name: 'تعطيل Threshold 1', desc: 'تسريع الماوس المستوى 1', cmd: 'reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /f' },
  { id: 'mouseThreshold2', name: 'تعطيل Threshold 2', desc: 'تسريع الماوس المستوى 2', cmd: 'reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /f' },
  { id: 'mouseBuffer', name: 'تقليل Mouse Buffer', desc: 'يقلل تأخير الإدخال', cmd: 'reg add "HKCU\\Control Panel\\Mouse" /v MouseHoverTime /t REG_SZ /d 10 /f', revert: 'reg delete "HKCU\\Control Panel\\Mouse" /v MouseHoverTime /f' },
  { id: 'enhancePointer', name: 'تعطيل Enhance Pointer Precision', desc: 'يمنع Windows من تحسين حركة الماوس', cmd: 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d 10 /f', revert: 'reg delete "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /f' },
  { id: 'keyboardDelay', name: 'تقليل Keyboard Delay', desc: 'يقلل تأخير لوحة المفاتيح', cmd: 'reg add "HKCU\\Control Panel\\Keyboard" /v KeyboardDelay /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Keyboard" /v KeyboardDelay /f' },
  { id: 'keyboardSpeed', name: 'زيادة Keyboard Repeat', desc: 'يسرع تكرار الحروف عند الضغط', cmd: 'reg add "HKCU\\Control Panel\\Keyboard" /v KeyboardSpeed /t REG_SZ /d 48 /f', revert: 'reg delete "HKCU\\Control Panel\\Keyboard" /v KeyboardSpeed /f' },
  { id: 'mouselagFix', name: 'إصلاح تأخير الماوس', desc: 'يقلل BufferSize للماوس', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters" /v MouseDataQueueSize /t REG_DWORD /d 10 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters" /v MouseDataQueueSize /f' },
  { id: 'keyboardLagFix', name: 'إصلاح تأخير الكيبورد', desc: 'يقلل BufferSize للوحة المفاتيح', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\kbdclass\\Parameters" /v KeyboardDataQueueSize /t REG_DWORD /d 10 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\kbdclass\\Parameters" /v KeyboardDataQueueSize /f' },
  { id: 'gameDvr', name: 'تعطيل Game DVR', desc: 'يمنع تسجيل الألعاب بالخلفية', cmd: 'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /f' },
  { id: 'fullscreenOpt', name: 'تعطيل Fullscreen Optimizations', desc: 'يمنع Windows من إضافة طبقة على اللعبة', cmd: 'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 2 /f', revert: 'reg delete "HKCU\\System\\GameConfigStore" /v GameDVR_FSEBehaviorMode /f' },
  { id: 'highPriority', name: 'رفع أولوية الماوس', desc: 'يعطي أولوية عالية لـ mouclass.sys', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass" /v Priority /t REG_DWORD /d 8 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouclass" /v Priority /f' }
];

async function getInputLagTweaks() {
  return INPUT_LAG_TWEAKS.map(t => ({ id: t.id, name: t.name, desc: t.desc }));
}

async function applyInputLagTweak(tweakId) {
  const tweak = INPUT_LAG_TWEAKS.find(t => t.id === tweakId);
  if (!tweak) return { name: 'غير معروف', status: 'failed' };
  try {
    await runFire(tweak.cmd);
    return { name: tweak.name, status: 'success' };
  } catch (e) {
    return { name: tweak.name, status: 'failed' };
  }
}

async function applyAllInputLagFixes() {
  const results = [];
  for (const tweak of INPUT_LAG_TWEAKS) {
    try {
      await runFire(tweak.cmd);
      results.push({ name: tweak.name, status: 'success' });
    } catch (e) {
      results.push({ name: tweak.name, status: 'failed' });
    }
  }
  return results;
}

async function revertAllInputLagFixes() {
  const results = [];
  for (const tweak of INPUT_LAG_TWEAKS) {
    try {
      await runFire(tweak.revert);
      results.push({ name: `إعادة ${tweak.name}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة ${tweak.name}`, status: 'failed' });
    }
  }
  return results;
}

module.exports = { getInputLagTweaks, applyInputLagTweak, applyAllInputLagFixes, revertAllInputLagFixes };
