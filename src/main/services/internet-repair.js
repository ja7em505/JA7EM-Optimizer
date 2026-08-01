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

async function resetTCP() {
  const fixes = [];
  try {
    await runFireAndForget('netsh int ip reset', 60000);
    fixes.push({ name: 'إعادة تعيين TCP/IP', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إعادة تعيين TCP/IP', status: 'failed' });
  }
  return fixes;
}

async function resetWinsock() {
  const fixes = [];
  try {
    await runFireAndForget('netsh winsock reset', 60000);
    fixes.push({ name: 'إعادة تعيين Winsock', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إعادة تعيين Winsock', status: 'failed' });
  }
  return fixes;
}

async function flushDNS() {
  const fixes = [];
  try {
    const out = await runPs('ipconfig /flushdns', 30000);
    if (out.includes('requires elevation') || out.includes('Access is denied') || out.includes('Run as administrator')) throw new Error('requires admin');
    fixes.push({ name: 'تفريغ DNS Cache', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تفريغ DNS Cache', status: 'failed', error: e.message });
  }
  try {
    const out = await runPs('ipconfig /release', 30000);
    if (out.includes('requires elevation') || out.includes('Access is denied') || out.includes('Run as administrator')) throw new Error('requires admin');
    fixes.push({ name: 'إطلاق IP', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إطلاق IP', status: 'failed', error: e.message });
  }
  try {
    const out = await runPs('ipconfig /renew', 60000);
    if (out.includes('requires elevation') || out.includes('Access is denied') || out.includes('Run as administrator')) throw new Error('requires admin');
    fixes.push({ name: 'تجديد IP', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تجديد IP', status: 'failed', error: e.message });
  }
  return fixes;
}

async function fixNetworkAdapters() {
  const fixes = [];
  try {
    await runFireAndForget('netsh interface ip set address "Wi-Fi" dhcp', 30000);
    fixes.push({ name: 'إصلاح Wi-Fi - DHCP', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح Wi-Fi - DHCP', status: 'failed' });
  }
  try {
    await runFireAndForget('netsh interface ip set dns "Wi-Fi" dhcp', 30000);
    fixes.push({ name: 'إصلاح DNS - DHCP', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إصلاح DNS - DHCP', status: 'failed' });
  }
  return fixes;
}

async function optimizeDNS() {
  const fixes = [];
  const dnsServers = [
    { adapter: 'Wi-Fi', primary: '8.8.8.8', secondary: '8.8.4.4', name: 'Google DNS' },
  ];

  for (const dns of dnsServers) {
    try {
      await runFireAndForget(`netsh interface ip set dns "${dns.adapter}" static ${dns.primary}`, 30000);
      await runFireAndForget(`netsh interface ip add dns "${dns.adapter}" ${dns.secondary} index=2`, 30000);
      fixes.push({ name: `تعيين ${dns.name} (${dns.primary})`, status: 'success' });
    } catch (e) {
      fixes.push({ name: `تعيين ${dns.name}`, status: 'failed' });
    }
  }

  try {
    await runFireAndForget('netsh int tcp set global autotuninglevel=normal', 30000);
    fixes.push({ name: 'تحسين TCP Auto-Tuning', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تحسين TCP Auto-Tuning', status: 'failed' });
  }

  try {
    await runFireAndForget('netsh int tcp set global chimney=enabled', 30000);
    fixes.push({ name: 'تفعيل TCP Chimney', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تفعيل TCP Chimney', status: 'failed' });
  }

  try {
    await runFireAndForget('netsh int tcp set global dca=enabled', 30000);
    fixes.push({ name: 'تفعيل DCA', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تفعيل DCA', status: 'failed' });
  }

  try {
    await runFireAndForget('netsh int tcp set global netdma=enabled', 30000);
    fixes.push({ name: 'تفعيل NetDMA', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تفعيل NetDMA', status: 'failed' });
  }

  try {
    await runFireAndForget('netsh int tcp set global timestamps=disabled', 30000);
    fixes.push({ name: 'تعطيل TCP Timestamps', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تعطيل TCP Timestamps', status: 'failed' });
  }

  return fixes;
}

async function resetFirewall() {
  const fixes = [];
  try {
    await runFireAndForget('netsh advfirewall reset', 30000);
    fixes.push({ name: 'إعادة تعيين Firewall', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'إعادة تعيين Firewall', status: 'failed' });
  }
  try {
    await runFireAndForget('netsh advfirewall set allprofiles state on', 30000);
    fixes.push({ name: 'تفعيل Firewall', status: 'success' });
  } catch (e) {
    fixes.push({ name: 'تفعيل Firewall', status: 'failed' });
  }
  return fixes;
}

async function fixSlowInternet() {
  const allResults = [];

  const dns = await optimizeDNS();
  allResults.push(...dns);

  const flush = await flushDNS();
  allResults.push(...flush);

  try {
    await runFireAndForget('powershell -Command "Get-NetAdapter | Restart-NetAdapter"', 60000);
    allResults.push({ name: 'إعادة تشغيل محولات الشبكة', status: 'success' });
  } catch (e) {
    allResults.push({ name: 'إعادة تشغيل محولات الشبكة', status: 'failed' });
  }

  return allResults;
}

async function fullInternetRepair() {
  const allResults = [];

  const flush = await flushDNS();
  allResults.push(...flush);

  const winsock = await resetWinsock();
  allResults.push(...winsock);

  const tcp = await resetTCP();
  allResults.push(...tcp);

  const adapters = await fixNetworkAdapters();
  allResults.push(...adapters);

  const dns = await optimizeDNS();
  allResults.push(...dns);

  const firewall = await resetFirewall();
  allResults.push(...firewall);

  try {
    await runFireAndForget('powershell -Command "Get-NetAdapter | Restart-NetAdapter"', 60000);
    allResults.push({ name: 'إعادة تشغيل كل محولات الشبكة', status: 'success' });
  } catch (e) {
    allResults.push({ name: 'إعادة تشغيل كل محولات الشبكة', status: 'failed' });
  }

  return allResults;
}

module.exports = {
  resetTCP,
  resetWinsock,
  flushDNS,
  fixNetworkAdapters,
  optimizeDNS,
  resetFirewall,
  fixSlowInternet,
  fullInternetRepair
};
