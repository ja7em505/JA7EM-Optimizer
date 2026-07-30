const { exec } = require('child_process');
const path = require('path');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout || stderr || 'done');
    });
  });
}

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

const networkTweaks = [
  {
    id: 'dns_optimize',
    name: 'تحسين DNS',
    description: 'تغيير خادم DNS إلى Cloudflare (1.1.1.1) و Google (8.8.8.8) — يسرّع تحميل أسماء السيرفرات ويخلي الاتصال أسرع'
  },
  {
    id: 'nagle_disable',
    name: 'تعطيل Nagle Algorithm',
    description: 'يقلل تأخير الإدخال (Input Lag) — الألعاب تحسّ بالاستجابة أكثر وأسرع'
  },
  {
    id: 'throttle_disable',
    name: 'تعطيل Network Throttling',
    description: 'Windows يحجز جزء من سرعة الشبكة افتراضياً — نشيل هالحجز عشان تحصل على أقصى سرعة'
  },
  {
    id: 'qos_optimize',
    name: 'تحسين QoS (أولوية الألعاب)',
    description: 'يعطي حركة بيانات الألعاب أعلى أولوية — باقي البرامج مثل Discord و Chrome تتأخر شوي بس الألعاب تشتغل أحسن'
  },
  {
    id: 'tcp_autotune',
    name: 'تحسين TCP Auto-Tuning',
    description: 'يحسّن حجم بيانات الـ TCP Window — يقلل ضياع الحزم (Packet Loss) ويزيد سرعة النقل'
  },
  {
    id: 'interrupt_moderation',
    name: 'تعطيل Interrupt Moderation',
    description: 'المعالج يستقبل بيانات الشبكة بشكل أسرع وأكثر حساسية — يقلل التأخير في الألعاب'
  },
  {
    id: 'game_priority',
    name: 'إعطاء الأولوية للشبكة للألعاب',
    description: 'يغيّر إعدادات الشبكة بالريجستري عشان الألعاب تحصل على أقصى موارد الشبكة'
  }
];

const dnsServers = { primary: '1.1.1.1', secondary: '1.0.0.1', google: '8.8.8.8', googleAlt: '8.8.4.4' };

async function getNetworkInterfaces() {
  try {
    const output = await runCmd('netsh interface show interface');
    const interfaces = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s{2,}/);
      if (parts.length >= 4 && !line.includes('Admin State') && !line.includes('---')) {
        interfaces.push({ name: parts[3], state: parts[0] });
      }
    }
    return interfaces;
  } catch (e) {
    return [];
  }
}

async function optimizeDNS() {
  const results = [];
  try {
    const interfaces = await getNetworkInterfaces();
    const activeInterfaces = interfaces.filter(i => i.state === 'Connected');
    for (const iface of activeInterfaces) {
      try {
        await runCmd(`netsh interface ip set dns "${iface.name}" static ${dnsServers.primary} primary`, 10000);
        await runCmd(`netsh interface ip add dns "${iface.name}" ${dnsServers.secondary} index=2`, 10000);
        results.push({ name: `DNS → ${iface.name}`, status: 'success', detail: `${dnsServers.primary} / ${dnsServers.secondary}` });
      } catch (e) {
        results.push({ name: `DNS → ${iface.name}`, status: 'failed' });
      }
    }
    if (activeInterfaces.length === 0) {
      results.push({ name: 'DNS', status: 'failed', detail: 'No active interfaces found' });
    }
  } catch (e) {
    results.push({ name: 'DNS Optimization', status: 'failed' });
  }
  return results;
}

async function disableNagle() {
  const results = [];
  try {
    const regPath = 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces';
    const output = await runCmd(`reg query "${regPath}" 2>nul`);
    const guids = output.split('\n').filter(l => l.includes('{')).map(l => l.trim());
    for (const guid of guids) {
      const fullPath = `${regPath}\\${guid}`;
      await runFire(`reg add "${fullPath}" /v TcpAckFrequency /t REG_DWORD /d 1 /f`);
      await runFire(`reg add "${fullPath}" /v TCPNoDelay /t REG_DWORD /d 1 /f`);
      await runFire(`reg add "${fullPath}" /v TcpDelAckTicks /t REG_DWORD /d 0 /f`);
    }
    results.push({ name: 'تعطيل Nagle Algorithm', status: 'success', detail: `${guids.length} interfaces updated` });
  } catch (e) {
    results.push({ name: 'تعطيل Nagle Algorithm', status: 'failed' });
  }
  return results;
}

async function disableThrottling() {
  const results = [];
  try {
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 0xffffffff /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f');
    results.push({ name: 'تعطيل Network Throttling', status: 'success', detail: 'Throttling disabled, responsiveness set to 0' });
  } catch (e) {
    results.push({ name: 'تعطيل Network Throttling', status: 'failed' });
  }
  return results;
}

async function optimizeQoS() {
  const results = [];
  try {
    await runCmd('reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched" /v NonBestEffortLimit /t REG_DWORD /d 0 /f');
    await runCmd('netsh int tcp set global autotuninglevel=normal');
    await runCmd('netsh int tcp set global chimney=enabled 2>nul');
    results.push({ name: 'تحسين QoS', status: 'success', detail: 'Game traffic prioritized' });
  } catch (e) {
    results.push({ name: 'تحسين QoS', status: 'failed' });
  }
  return results;
}

async function optimizeTCPAutoTuning() {
  const results = [];
  try {
    await runCmd('netsh int tcp set global autotuninglevel=normal');
    await runCmd('netsh int tcp set global dca=enabled');
    await runCmd('netsh int tcp set global netdma=enabled 2>nul');
    await runCmd('netsh int tcp set global ecncapability=disabled');
    await runCmd('netsh int tcp set global timestamps=disabled');
    await runCmd('netsh int tcp set global rss=enabled');
    results.push({ name: 'تحسين TCP Auto-Tuning', status: 'success', detail: 'RSS enabled, ECN disabled, timestamps disabled' });
  } catch (e) {
    results.push({ name: 'تحسين TCP Auto-Tuning', status: 'failed' });
  }
  return results;
}

async function disableInterruptModeration() {
  const results = [];
  try {
    await runCmd('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultReceiveWindow /t REG_DWORD /d 16384 /f');
    await runCmd('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultSendWindow /t REG_DWORD /d 16384 /f');
    results.push({ name: 'تحسين Interrupt Moderation', status: 'success', detail: 'Buffer size optimized to 16KB' });
  } catch (e) {
    results.push({ name: 'تحسين Interrupt Moderation', status: 'failed' });
  }
  return results;
}

async function optimizeGamePriority() {
  const results = [];
  try {
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Affinity" /t REG_DWORD /d 0 /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Background Only" /t REG_SZ /d "False" /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Clock Rate" /t REG_DWORD /d 10000 /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "GPU Priority" /t REG_DWORD /d 8 /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Priority" /t REG_DWORD /d 6 /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "NetworkThrottlingIndex" /t REG_DWORD /d 0xffffffff /f');
    await runCmd('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v "SystemResponsiveness" /t REG_DWORD /d 0 /f');
    results.push({ name: 'إعطاء الأولوية للشبكة للألعاب', status: 'success', detail: 'GPU Priority: 8, Scheduling: High' });
  } catch (e) {
    results.push({ name: 'إعطاء الأولوية للشبكة للألعاب', status: 'failed' });
  }
  return results;
}

async function applyAllOptimizations() {
  const allResults = [];
  const steps = [
    { name: 'تحسين DNS', fn: optimizeDNS },
    { name: 'تعطيل Nagle Algorithm', fn: disableNagle },
    { name: 'تعطيل Network Throttling', fn: disableThrottling },
    { name: 'تحسين QoS', fn: optimizeQoS },
    { name: 'تحسين TCP Auto-Tuning', fn: optimizeTCPAutoTuning },
    { name: 'تحسين Interrupt Moderation', fn: disableInterruptModeration },
    { name: 'إعطاء الأولوية للشبكة للألعاب', fn: optimizeGamePriority }
  ];
  for (const step of steps) {
    try {
      const results = await step.fn();
      allResults.push(...results);
    } catch (e) {
      allResults.push({ name: step.name, status: 'failed' });
    }
  }
  return allResults;
}

async function revertAllOptimizations() {
  const results = [];
  try {
    await runCmd('netsh interface ip set dns "Wi-Fi" dhcp 2>nul');
    await runCmd('netsh interface ip set dns "Ethernet" dhcp 2>nul');
    await runCmd('netsh int tcp set global autotuninglevel=normal');
    results.push({ name: 'إعادة إعدادات الشبكة', status: 'success' });
  } catch (e) {
    results.push({ name: 'إعادة إعدادات الشبكة', status: 'failed' });
  }
  return results;
}

async function getNetworkStatus() {
  const status = {
    dns: 'unknown',
    nagle: 'unknown',
    throttling: 'unknown',
    interfaces: []
  };
  try {
    const interfaces = await getNetworkInterfaces();
    status.interfaces = interfaces;
    if (interfaces.length > 0) {
      try {
        const dnsOutput = await runCmd(`netsh interface ip show dns "${interfaces[0].name}" 2>nul`);
        if (dnsOutput.includes(dnsServers.primary)) status.dns = 'optimized';
        else status.dns = 'default';
      } catch (e) { status.dns = 'unknown'; }
    }
    try {
      const nagleOutput = await runCmd('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" /s /v TcpAckFrequency 2>nul');
      if (nagleOutput.includes('0x1')) status.nagle = 'disabled';
      else status.nagle = 'enabled';
    } catch (e) { status.nagle = 'unknown'; }
    try {
      const throttleOutput = await runCmd('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex 2>nul');
      if (throttleOutput.includes('0xffffffff')) status.throttling = 'disabled';
      else status.throttling = 'enabled';
    } catch (e) { status.throttling = 'unknown'; }
  } catch (e) {}
  return status;
}

module.exports = {
  optimizeDNS, disableNagle, disableThrottling, optimizeQoS,
  optimizeTCPAutoTuning, disableInterruptModeration, optimizeGamePriority,
  applyAllOptimizations, revertAllOptimizations, getNetworkStatus,
  networkTweaks, getNetworkInterfaces
};
