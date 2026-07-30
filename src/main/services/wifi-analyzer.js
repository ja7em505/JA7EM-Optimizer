const { exec } = require('child_process');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err); else resolve(stdout || '');
    });
  });
}

async function getWifiNetworks() {
  try {
    const output = await runCmd('netsh wlan show networks mode=bssid');
    const networks = [];
    const blocks = output.split('\n\n');
    for (const block of blocks) {
      const ssidMatch = block.match(/SSID\s+\d+\s*:\s*(.+)/);
      const signalMatch = block.match(/Signal\s*:\s*(\d+)%/);
      const authMatch = block.match(/Authentication\s*:\s*(.+)/);
      const cipherMatch = block.match(/Encryption\s*:\s*(.+)/);
      const channelMatch = block.match(/Channel\s*:\s*(\d+)/);
      const bssidMatch = block.match(/BSSID\s+\d+\s*:\s*([\w:]+)/);
      if (ssidMatch && signalMatch) {
        networks.push({
          ssid: ssidMatch[1].trim(),
          signal: parseInt(signalMatch[1]),
          signalBars: parseInt(signalMatch[1]) >= 80 ? '▂▄▆█' : parseInt(signalMatch[1]) >= 60 ? '▂▄▆_' : parseInt(signalMatch[1]) >= 40 ? '▂▄__' : '▂___',
          auth: authMatch ? authMatch[1].trim() : 'Unknown',
          cipher: cipherMatch ? cipherMatch[1].trim() : 'Unknown',
          channel: channelMatch ? parseInt(channelMatch[1]) : 0,
          bssid: bssidMatch ? bssidMatch[1].trim() : ''
        });
      }
    }
    return networks;
  } catch (e) { return []; }
}

async function getCurrentWifi() {
  try {
    const output = await runCmd('netsh wlan show interfaces');
    const ssidMatch = output.match(/SSID\s*:\s*(.+)/);
    const signalMatch = output.match(/Signal\s*:\s*(\d+)%/);
    const channelMatch = output.match(/Channel\s*:\s*(\d+)/);
    const speedMatch = output.match(/Link speed\s*:\s*(.+)/);
    const stateMatch = output.match(/State\s*:\s*(.+)/);
    return {
      ssid: ssidMatch ? ssidMatch[1].trim() : 'Not connected',
      signal: signalMatch ? parseInt(signalMatch[1]) : 0,
      channel: channelMatch ? parseInt(channelMatch[1]) : 0,
      speed: speedMatch ? speedMatch[1].trim() : 'Unknown',
      state: stateMatch ? stateMatch[1].trim() : 'Unknown'
    };
  } catch (e) { return { ssid: 'Unknown', signal: 0, channel: 0, speed: 'Unknown', state: 'Unknown' }; }
}

async function getWifiProfiles() {
  try {
    const output = await runCmd('netsh wlan show profiles');
    const profiles = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/All User Profile\s*:\s*(.+)/);
      if (match) profiles.push(match[1].trim());
    }
    return profiles;
  } catch (e) { return []; }
}

module.exports = { getWifiNetworks, getCurrentWifi, getWifiProfiles };
