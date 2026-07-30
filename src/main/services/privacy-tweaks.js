const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}
function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

const privacyTweaks = [
  { id: 'telemetry', name: 'تعطيل Telemetry', description: 'يقفي جمع البيانات من Microsoft — Windows ما بيبعث معلومات عنك' },
  { id: 'cortana', name: 'تعطيل Cortana', description: 'يقفي المساعد الصوتي — يوفر موارد ويخلي الخصوصية أحسن' },
  { id: 'activity_history', name: 'حذف سجل النشاط', description: 'يحذف كل سجلات النشاط اللي Windows يحفظها' },
  { id: 'ad_id', name: 'تعطيل Advertising ID', description: 'يقفي التعريف الإعلاني — Microsoft ما يقدر يتتبعك بالإعلانات' },
  { id: 'location', name: 'تعطيل Location Tracking', description: 'يقفي تتبع الموقع — البرامج ما تقدر تعرف وينك' },
  { id: 'camera_mic', name: 'خصوصية الكاميرا والميكروفون', description: 'يحذف صلاحيات البرامج من الكاميرا والميكروفون' },
  { id: 'feedback', name: 'تعطيل Feedback', description: 'يقفي طلبات التقييم من Windows' },
  { id: 'diagnostics', name: 'تقليل Diagnostics', description: 'يخفف كمية البيانات التشخيصية اللي تتبعت' },
  { id: 'timeline', name: 'تعطيل Timeline', description: 'يقفي ميزة Timeline اللي تحفظ كل شو سويت' },
  { id: 'widgets', name: 'تعطيل Widgets', description: 'يقفي Widgets اللي تظهر بالشريط — تختصر الموارد' }
];

async function applyPrivacyTweak(tweakId) {
  const results = [];
  switch (tweakId) {
    case 'telemetry':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f');
        await runFire('sc stop DiagTrack 2>nul');
        await runFire('sc config DiagTrack start= disabled 2>nul');
        results.push({ name: 'تعطيل Telemetry', status: 'success' });
      } catch (e) { results.push({ name: 'Telemetry', status: 'failed' }); }
      break;
    case 'cortana':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search" /v AllowCortana /t REG_DWORD /d 0 /f');
        results.push({ name: 'تعطيل Cortana', status: 'success' });
      } catch (e) { results.push({ name: 'Cortana', status: 'failed' }); }
      break;
    case 'activity_history':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" /v EnableActivityFeed /t REG_DWORD /d 0 /f');
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" /v PublishUserActivities /t REG_DWORD /d 0 /f');
        results.push({ name: 'حذف سجل النشاط', status: 'success' });
      } catch (e) { results.push({ name: 'Activity History', status: 'failed' }); }
      break;
    case 'ad_id':
      try {
        await runCmd('reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" /v Enabled /t REG_DWORD /d 0 /f');
        results.push({ name: 'تعطيل Advertising ID', status: 'success' });
      } catch (e) { results.push({ name: 'Ad ID', status: 'failed' }); }
      break;
    case 'location':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors" /v DisableLocation /t REG_DWORD /d 1 /f');
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors" /v DisableWindowsLocationProvider /t REG_DWORD /d 1 /f');
        results.push({ name: 'تعطيل Location Tracking', status: 'success' });
      } catch (e) { results.push({ name: 'Location', status: 'failed' }); }
      break;
    case 'feedback':
      try {
        await runCmd('reg add "HKCU\\SOFTWARE\\Microsoft\\Siuf\\Rules" /v NumberOfSIUFInPeriod /t REG_DWORD /d 0 /f');
        await runCmd('reg add "HKCU\\SOFTWARE\\Microsoft\\Siuf\\Rules" /v PeriodInNanoSeconds /t REG_DWORD /d 0 /f');
        results.push({ name: 'تعطيل Feedback', status: 'success' });
      } catch (e) { results.push({ name: 'Feedback', status: 'failed' }); }
      break;
    case 'diagnostics':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v MaxTelemetryAllowed /t REG_DWORD /d 0 /f');
        results.push({ name: 'تقليل Diagnostics', status: 'success' });
      } catch (e) { results.push({ name: 'Diagnostics', status: 'failed' }); }
      break;
    case 'timeline':
      try {
        await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" /v EnableActivityFeed /t REG_DWORD /d 0 /f');
        results.push({ name: 'تعطيل Timeline', status: 'success' });
      } catch (e) { results.push({ name: 'Timeline', status: 'failed' }); }
      break;
    case 'widgets':
      try {
        await runCmd('reg add "HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Feeds" /v EnableFeeds /t REG_DWORD /d 0 /f');
        results.push({ name: 'تعطيل Widgets', status: 'success' });
      } catch (e) { results.push({ name: 'Widgets', status: 'failed' }); }
      break;
  }
  return results;
}

async function applyAllPrivacy() {
  const all = [];
  for (const tweak of privacyTweaks) {
    const results = await applyPrivacyTweak(tweak.id);
    all.push(...results);
  }
  return all;
}

module.exports = { privacyTweaks, applyPrivacyTweak, applyAllPrivacy };
