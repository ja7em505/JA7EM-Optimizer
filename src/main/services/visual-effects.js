const { exec } = require('child_process');

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

const VISUAL_TWEAKS = [
  { id: 'visualFX', name: 'تعطيل التأثيرات البصرية', desc: 'VisualFXSetting = 2 (أداء أفضل)', cmd: 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f', revert: 'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /f' },
  { id: 'animations', name: 'تعطيل الرسوم المتحركة', desc: 'إيقاف animate windows', cmd: 'reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /f' },
  { id: 'transparency', name: 'تعطيل الشفافية', desc: 'إيقاف تأثيرات الشفافية', cmd: 'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v EnableTransparency /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" /v EnableTransparency /f' },
  { id: 'taskbarAnim', name: 'تعطيل تحريك شريط المهام', desc: 'إيقاف Taskbar animations', cmd: 'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v TaskbarAnimations /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v TaskbarAnimations /f' },
  { id: 'menuAnim', name: 'تعطيل تحريك القوائم', desc: 'إيقاف Menu animations', cmd: 'reg add "HKCU\\Control Panel\\Desktop" /v MenuShowDelay /t REG_SZ /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Desktop" /v MenuShowDelay /f' },
  { id: 'shadow', name: 'تعطيل الظلال', desc: 'إيقاف ظلال النوافذ', cmd: 'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v EnableWindowShadow /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v EnableWindowShadow /f' },
  { id: 'smoothScroll', name: 'تعطيل التمرير السلس', desc: 'إيقاف Smooth scroll', cmd: 'reg add "HKCU\\Control Panel\\Desktop" /v SmoothScroll /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\Control Panel\\Desktop" /v SmoothScroll /f' },
  { id: 'dockAnim', name: 'تعطيل تحريك شريط التشغيل السريع', desc: 'إيقاف التنشيط السريع', cmd: 'reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v UseOLEDTaskbarTransparency /t REG_DWORD /d 0 /f', revert: 'reg delete "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v UseOLEDTaskbarTransparency /f' }
];

async function getVisualTweaks() {
  return VISUAL_TWEAKS.map(t => ({ id: t.id, name: t.name, desc: t.desc }));
}

async function applyVisualTweak(tweakId) {
  const tweak = VISUAL_TWEAKS.find(t => t.id === tweakId);
  if (!tweak) return { name: 'غير معروف', status: 'failed' };
  try {
    await runFire(tweak.cmd);
    return { name: tweak.name, status: 'success' };
  } catch (e) {
    return { name: tweak.name, status: 'failed' };
  }
}

async function applyAllVisualTweaks() {
  const results = [];
  for (const tweak of VISUAL_TWEAKS) {
    try {
      await runFire(tweak.cmd);
      results.push({ name: tweak.name, status: 'success' });
    } catch (e) {
      results.push({ name: tweak.name, status: 'failed' });
    }
  }
  return results;
}

async function revertAllVisualTweaks() {
  const results = [];
  for (const tweak of VISUAL_TWEAKS) {
    try {
      await runFire(tweak.revert);
      results.push({ name: `إعادة ${tweak.name}`, status: 'success' });
    } catch (e) {
      results.push({ name: `إعادة ${tweak.name}`, status: 'failed' });
    }
  }
  return results;
}

module.exports = { getVisualTweaks, applyVisualTweak, applyAllVisualTweaks, revertAllVisualTweaks };
