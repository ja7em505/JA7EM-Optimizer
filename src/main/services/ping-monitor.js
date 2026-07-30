const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}

const presetTargets = [
  { name: 'Google DNS', host: '8.8.8.8' },
  { name: 'Cloudflare DNS', host: '1.1.1.1' },
  { name: 'Local Gateway', host: '192.168.1.1' }
];

async function pingOnce(host) {
  try {
    const output = await runCmd(`ping -n 1 -w 2000 ${host}`, 5000);
    const timeMatch = output.match(/time[=<](\d+)ms/i);
    const lostMatch = output.match(/Lost = (\d+)/);
    if (timeMatch) {
      return { host, ping: parseInt(timeMatch[1]), lost: lostMatch ? parseInt(lostMatch[1]) : 0, reachable: true };
    }
    return { host, ping: -1, lost: 1, reachable: false };
  } catch (e) {
    return { host, ping: -1, lost: 1, reachable: false };
  }
}

async function pingSweep(host, count = 4) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const r = await pingOnce(host);
    results.push(r);
  }
  const pings = results.filter(r => r.reachable).map(r => r.ping);
  const avg = pings.length > 0 ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : -1;
  const min = pings.length > 0 ? Math.min(...pings) : -1;
  const max = pings.length > 0 ? Math.max(...pings) : -1;
  const loss = count - pings.length;
  const jitter = pings.length > 1 ? Math.max(...pings) - Math.min(...pings) : 0;
  return { host, avg, min, max, loss, jitter, count, results };
}

module.exports = { pingOnce, pingSweep, presetTargets };
