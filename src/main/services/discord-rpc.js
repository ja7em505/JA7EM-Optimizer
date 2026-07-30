const RPC = require('discord-rpc');

const DEFAULT_CLIENT_ID = '1531976098185875457';
let client = null;
let ready = false;
let connected = false;
let enabled = true;

function getStatus() {
  return { connected, ready, enabled };
}

async function start() {
  if (!enabled) return { status: 'disabled' };
  if (connected) { stop(); }
  try {
    client = new RPC.Client({ transport: 'ipc' });
    client.on('ready', () => {
      ready = true;
      connected = true;
      setActivity();
    });
    client.on('disconnected', () => {
      connected = false;
      ready = false;
    });
    await client.login({ clientId: DEFAULT_CLIENT_ID });
    return { status: 'connected' };
  } catch (e) {
    connected = false;
    ready = false;
    return { status: 'failed', error: e.message };
  }
}

function setActivity() {
  if (!client || !ready) return;
  try {
    client.setActivity({
      details: 'برنامج تحسين الألعاب',
      state: 'JA7EM OPTIMIZER v1.0.0',
      startTimestamp: Date.now(),
      largeImageKey: 'icon',
      largeImageText: 'JA7EM OPTIMIZER',
      instance: false
    });
  } catch (e) {}
}

async function stop() {
  if (client) {
    try {
      client.destroy();
    } catch (e) {}
    client = null;
  }
  ready = false;
  connected = false;
  return { status: 'disconnected' };
}

function setEnabled(val) {
  enabled = val;
  if (!val) stop();
  return { enabled };
}

module.exports = { start, stop, getStatus, setEnabled, setActivity };
