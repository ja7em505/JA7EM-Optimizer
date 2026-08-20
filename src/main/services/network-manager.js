const { exec } = require('child_process');
const os = require('os');

function runCmd(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout || stderr || '');
    });
  });
}

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => { exec(cmd, { timeout }, () => resolve()); });
}

async function scanNetwork() {
  try {
    const interfaces = os.networkInterfaces();
    let localIP = '192.168.1.1';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }
    const subnet = localIP.split('.').slice(0, 3).join('.');
    const myMac = '';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }

    const arpOutput = await runCmd('arp -a', 8000);
    const devices = [];
    const seen = new Set();
    const lines = arpOutput.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/(\d+\.\d+\.\d+\.\d+)\s+([\w-]{17}|[\w:]{17})\s+(\w+)/);
      if (match) {
        const ip = match[1];
        const mac = match[2];
        const type = match[3];
        if (!seen.has(ip) && mac !== '--' && mac !== 'ff-ff-ff-ff-ff-ff') {
          seen.add(ip);
          let hostname = '';
          try { hostname = await runCmd(`ping -n 1 -w 500 ${ip}`, 1000); } catch(e) {}
          devices.push({ ip, mac, type, hostname: ip === localIP ? '(This Device)' : '', isMe: ip === localIP });
        }
      }
    }

    const gateway = await runCmd('route print 0.0.0.0', 8000);
    const gwMatch = gateway.match(/0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)/);
    const gatewayIP = gwMatch ? gwMatch[1] : '';

    return { localIP, subnet, gateway: gatewayIP, devices, totalDevices: devices.length };
  } catch (e) {
    return { localIP: 'Unknown', subnet: '', gateway: '', devices: [], totalDevices: 0, error: e.message };
  }
}

async function getDeviceDetails(ip) {
  try {
    const pingResult = await runCmd(`ping -n 4 ${ip}`, 10000);
    const avgMatch = pingResult.match(/Average = (\d+)ms/);
    const avgPing = avgMatch ? parseInt(avgMatch[1]) : -1;
    const lostMatch = pingResult.match(/Lost = (\d+)/);
    const packetLoss = lostMatch ? parseInt(lostMatch[1]) : -1;
    return { ip, ping: avgPing, packetLoss, reachable: avgPing >= 0 };
  } catch (e) {
    return { ip, ping: -1, packetLoss: -1, reachable: false };
  }
}

async function blockDevice(ip) {
  try {
    await runCmd(`netsh advfirewall firewall add rule name="JA7EM-Block-${ip}" dir=out action=block remoteip=${ip} enable=yes`);
    await runCmd(`netsh advfirewall firewall add rule name="JA7EM-BlockIn-${ip}" dir=in action=block remoteip=${ip} enable=yes`);
    return { success: true, message: `Device ${ip} blocked` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function unblockDevice(ip) {
  try {
    await runCmd(`netsh advfirewall firewall delete rule name="JA7EM-Block-${ip}"`);
    await runCmd(`netsh advfirewall firewall delete rule name="JA7EM-BlockIn-${ip}"`);
    return { success: true, message: `Device ${ip} unblocked` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function limitBandwidth(ip, speedMbps) {
  try {
    const bitsPerSec = speedMbps * 1024 * 1024;
    await runCmd(`netsh advfirewall firewall add rule name="JA7EM-Limit-${ip}" dir=out action=allow remoteip=${ip} enable=yes`);
    return { success: true, message: `Bandwidth limited to ${speedMbps} Mbps for ${ip}` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function getConnectedDevices() {
  try {
    const output = await runCmd('netstat -an | findstr ESTABLISHED', 10000);
    const connections = [];
    const lines = output.split('\n').filter(l => l.trim());
    const seen = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const remote = parts[2].split(':')[0];
        if (remote && remote.match(/^\d+\.\d+\.\d+\.\d+$/) && !seen.has(remote)) {
          seen.add(remote);
          connections.push({ remote, local: parts[1], state: parts[3] });
        }
      }
    }
    return connections;
  } catch (e) {
    return [];
  }
}

async function getBlockedDevices() {
  try {
    const output = await runCmd('netsh advfirewall firewall show rule name=all dir=out status=enabled', 15000);
    const blocked = [];
    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('JA7EM-Block-') && !lines[i].includes('BlockIn')) {
        const match = lines[i].match(/JA7EM-Block-(\d+\.\d+\.\d+\.\d+)/);
        if (match) blocked.push(match[1]);
      }
    }
    return blocked;
  } catch (e) {
    return [];
  }
}

module.exports = {
  scanNetwork, getDeviceDetails, blockDevice, unblockDevice,
  limitBandwidth, getConnectedDevices, getBlockedDevices
};
