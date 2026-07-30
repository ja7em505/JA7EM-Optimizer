const { exec } = require('child_process');
const https = require('https');
const http = require('http');

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

async function getSpeedTestServers() {
  return [
    { id: '1', name: 'Cloudflare', url: 'http://speed.cloudflare.com/__down?bytes=25000000' },
    { id: '2', name: 'Google', url: 'http://dl.google.com/linux/google-chrome/stable/current/google-chrome-stable_current_amd64.deb' },
    { id: '3', name: 'Microsoft', url: 'http://speedtest.net/speedtest-servers-static.php' }
  ];
}

async function runSpeedTest() {
  const results = {
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0,
    server: 'Cloudflare',
    details: []
  };

  // Ping test
  try {
    const pingResult = await runPs('powershell -Command "(Test-Connection -ComputerName 8.8.8.8 -Count 4 | Measure-Object -Property ResponseTime -Average).Average"', 15000);
    results.ping = Math.round(parseFloat(pingResult.trim()) || 0);
    results.details.push({ name: 'Ping', value: results.ping + ' ms', status: 'success' });
  } catch (e) {
    results.details.push({ name: 'Ping', value: 'N/A', status: 'failed' });
  }

  // Download test - using PowerShell to download a file and measure speed
  try {
    const dlStart = Date.now();
    await runFireAndForget('powershell -Command "$ProgressPreference = \'SilentlyContinue\'; Invoke-WebRequest -Uri \'http://speed.cloudflare.com/__down?bytes=10000000\' -OutFile $env:TEMP\\speedtest_dl.tmp -TimeoutSec 15"', 30000);
    const dlEnd = Date.now();
    const dlTime = (dlEnd - dlStart) / 1000;
    const dlSize = 10000000; // 10 MB
    results.download = Math.round((dlSize * 8) / dlTime / 1000000);
    results.details.push({ name: 'Download', value: results.download + ' Mbps', status: 'success' });
  } catch (e) {
    results.details.push({ name: 'Download', value: 'N/A', status: 'failed' });
  }

  // Upload test - using PowerShell to upload data
  try {
    const testFile = `${process.env.TEMP}\\speedtest_ul.tmp`;
    try {
      const buf = Buffer.alloc(5000000, 0);
      require('fs').writeFileSync(testFile, buf);
    } catch (e) { }

    const ulStart = Date.now();
    await runFireAndForget(`powershell -Command "$ProgressPreference = \'SilentlyContinue\'; $bytes = [System.IO.File]::ReadAllBytes(\'${testFile}\'); $wc = New-Object System.Net.WebClient; $wc.UploadData(\'http://speed.cloudflare.com/__up\', $bytes)"`, 30000);
    const ulEnd = Date.now();
    const ulTime = (ulEnd - ulStart) / 1000;
    const ulSize = 5000000;
    results.upload = Math.round((ulSize * 8) / ulTime / 1000000);
    results.details.push({ name: 'Upload', value: results.upload + ' Mbps', status: 'success' });

    try { require('fs').unlinkSync(testFile); } catch (e) { }
  } catch (e) {
    results.details.push({ name: 'Upload', value: 'N/A', status: 'failed' });
  }

  // Jitter test
  try {
    const pings = [];
    for (let i = 0; i < 10; i++) {
      try {
        const p = await runPs('powershell -Command "(Test-Connection -ComputerName 8.8.8.8 -Count 1).ResponseTime"', 5000);
        pings.push(parseFloat(p.trim()) || 0);
      } catch (e) { }
    }
    if (pings.length > 1) {
      const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
      const variance = pings.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / pings.length;
      results.jitter = Math.round(Math.sqrt(variance));
    }
    results.details.push({ name: 'Jitter', value: results.jitter + ' ms', status: 'success' });
  } catch (e) {
    results.details.push({ name: 'Jitter', value: 'N/A', status: 'failed' });
  }

  // Rating
  if (results.download >= 100) results.rating = 'ممتاز';
  else if (results.download >= 50) results.rating = 'جيد جداً';
  else if (results.download >= 25) results.rating = 'جيد';
  else if (results.download >= 10) results.rating = 'مقبول';
  else results.rating = 'بطيء';

  return results;
}

module.exports = { runSpeedTest, getSpeedTestServers };
