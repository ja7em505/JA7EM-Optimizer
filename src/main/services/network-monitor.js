const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getActiveConnections() {
  const connections = [];

  try {
    const output = await runPs('powershell -Command "Get-NetTCPConnection | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess,@{N=\'ProcessName\';E={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} | ConvertTo-Json"', 20000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const conn of arr) {
      connections.push({
        localAddress: conn.LocalAddress,
        localPort: conn.LocalPort,
        remoteAddress: conn.RemoteAddress,
        remotePort: conn.RemotePort,
        state: conn.State,
        pid: conn.OwningProcess,
        process: conn.ProcessName || 'Unknown'
      });
    }
  } catch (e) { }

  return connections.filter(c => c.remoteAddress && c.remoteAddress !== '0.0.0.0' && c.remoteAddress !== '::' && c.remoteAddress !== '127.0.0.1');
}

async function getNetworkStats() {
  try {
    const output = await runPs('powershell -Command "Get-NetAdapter | Where-Object { $_.Status -eq \'Up\' } | Select-Object Name,LinkSpeed,ReceivedBytes,SentBytes,MacAddress,Status | ConvertTo-Json"', 15000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map(adapter => ({
      name: adapter.Name,
      speed: adapter.LinkSpeed,
      received: adapter.ReceivedBytes ? Math.round(adapter.ReceivedBytes / 1048576) + ' MB' : 'N/A',
      sent: adapter.SentBytes ? Math.round(adapter.SentBytes / 1048576) + ' MB' : 'N/A',
      mac: adapter.MacAddress,
      status: adapter.Status
    }));
  } catch (e) {
    return [];
  }
}

async function getWifiProfiles() {
  const profiles = [];

  try {
    const output = await runPs('netsh wlan show profiles', 10000);
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/All User Profile\s*:\s*(.+)/i) || line.match(/All Users Profile\s*:\s*(.+)/i);
      if (match) {
        profiles.push(match[1].trim());
      }
    }
  } catch (e) { }

  return profiles;
}

async function getWifiPassword(profileName) {
  try {
    const output = await runPs(`netsh wlan show profile name="${profileName}" key=clear`, 10000);
    const keyMatch = output.match(/Key Content\s*:\s*(.+)/i);
    return keyMatch ? keyMatch[1].trim() : 'N/A';
  } catch (e) {
    return 'N/A';
  }
}

module.exports = { getActiveConnections, getNetworkStats, getWifiProfiles, getWifiPassword };
