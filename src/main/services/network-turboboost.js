const { exec } = require('child_process');
const { promisify } = require('util');
const execP = promisify(exec);

function run(cmd, timeout = 15000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

const TWEAKS = [
  { id: 'nagle', name: 'تعطيل Nagle Algorithm', desc: 'يقلل تأخير الحزم للألعاب', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" /v TcpAckFrequency /t REG_DWORD /d 1 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" /v TcpAckFrequency /f' },
  { id: 'tcpNoDelay', name: 'تفعيل TCP NoDelay', desc: 'إرسال الحزم بدون انتظار', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" /v TCPNoDelay /t REG_DWORD /d 1 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" /v TCPNoDelay /f' },
  { id: 'mtu', name: 'تحسين MTU', desc: 'ضبط 1492 للألعاب (يقلل تجزئة الحزم)', cmd: 'netsh interface ipv4 set subinterface "Ethernet" mtu=1492 store=persistent', revert: 'netsh interface ipv4 set subinterface "Ethernet" mtu=1500 store=persistent' },
  { id: 'mtuWifi', name: 'تحسين MTU للواي فاي', desc: 'ضبط 1492 للواي فاي', cmd: 'netsh interface ipv4 set subinterface "Wi-Fi" mtu=1492 store=persistent', revert: 'netsh interface ipv4 set subinterface "Wi-Fi" mtu=1500 store=persistent' },
  { id: 'rss', name: 'تفعيل RSS', desc: 'توزيع حمولة الشبكة على أنوية CPU', cmd: 'netsh int tcp set global rss=enabled', revert: 'netsh int tcp set global rss=disabled' },
  { id: 'chimney', name: 'تفعيل TCP Chimney', desc: 'تفريغ معالجة TCP على كرت الشبكة', cmd: 'netsh int tcp set global chimney=enabled', revert: 'netsh int tcp set global chimney=disabled' },
  { id: 'netDMA', name: 'تفعيل NetDMA', desc: 'نقل البيانات المباشر بالذاكرة', cmd: 'netsh int tcp set global netdma=enabled', revert: 'netsh int tcp set global netdma=disabled' },
  { id: 'autoTuning', name: 'ضبط Auto Tuning', desc: 'تحسين استقبال الحزم (normal)', cmd: 'netsh int tcp set global autotuninglevel=normal', revert: 'netsh int tcp set global autotuninglevel=disabled' },
  { id: 'ecn', name: 'تعطيل ECN', desc: 'يمنع تقطيع الحزم', cmd: 'netsh int tcp set global ecncapability=disabled', revert: 'netsh int tcp set global ecncapability=enabled' },
  { id: 'timestamps', name: 'تعطيل Timestamps', desc: 'يقلل حجم رأس TCP', cmd: 'netsh int tcp set global timestamps=disabled', revert: 'netsh int tcp set global timestamps=enabled' },
  { id: 'initialRto', name: 'تقليل Initial RTO', desc: 'يسرع إعادة الاتصال', cmd: 'netsh int tcp set global initialRto=2000', revert: 'netsh int tcp set global initialRto=3000' },
  { id: 'fastOpen', name: 'تفعيل TCP Fast Open', desc: 'يسرع فتح الاتصالات الجديدة', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v EnableTCPFastOpen /t REG_DWORD /d 3 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters" /v EnableTCPFastOpen /f' },
  { id: 'dnsCache', name: 'زيادة DNS Cache', desc: 'يسرع تحليل أسماء السيرفرات', cmd: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters" /v CacheHashTableBucketSize /t REG_DWORD /d 5 /f', revert: 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters" /v CacheHashTableBucketSize /f' },
  { id: 'winScale', name: 'تفعيل Window Scaling', desc: 'يحسن سرعة تحميل الحزم', cmd: 'netsh int tcp set global autotuninglevel=experimental', revert: 'netsh int tcp set global autotuninglevel=normal' }
];

async function getAllTweaks() {
  return TWEAKS.map(t => ({ id: t.id, name: t.name, desc: t.desc }));
}

async function applyTweak(tweakId) {
  const tweak = TWEAKS.find(t => t.id === tweakId);
  if (!tweak) return { name: 'غير معروف', status: 'failed' };
  try { await run(tweak.cmd); return { name: tweak.name, status: 'success' }; }
  catch { return { name: tweak.name, status: 'failed' }; }
}

async function applyAll() {
  const results = [];
  for (const tweak of TWEAKS) {
    try { await run(tweak.cmd); results.push({ name: tweak.name, status: 'success' }); }
    catch { results.push({ name: tweak.name, status: 'failed' }); }
  }
  return results;
}

async function revertAll() {
  const results = [];
  for (const tweak of TWEAKS) {
    try { await run(tweak.revert); results.push({ name: `إعادة ${tweak.name}`, status: 'success' }); }
    catch { results.push({ name: `إعادة ${tweak.name}`, status: 'failed' }); }
  }
  return results;
}

module.exports = { getAllTweaks, applyTweak, applyAll, revertAll };
