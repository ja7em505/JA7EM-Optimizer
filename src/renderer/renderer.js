let currentPage = 'dashboard';
let monitorInterval = null;
let selectedPreset = 'balanced';
let scannedGames = [];
let isLicensed = false;
let licenseCountdownInterval = null;
let licenseStatus = null;

const PAID_PAGES = ['fps', 'clean', 'winrepair', 'netrepair', 'gamemode', 'ram', 'stutter', 'drivers', 'power', 'restore', 'speedtest', 'gpu', 'mousefix', 'privacy', 'browsrclean', 'ctxmenu', 'gametranslator'];

function formatTimeRemaining(expiryDate) {
  if (!expiryDate) return { text: 'Unlimited', sub: 'No expiration', color: '#22c55e' };
  const now = new Date();
  const exp = new Date(expiryDate);
  const diff = exp - now;
  if (diff <= 0) return { text: 'Expired', sub: 'License has expired', color: '#ef4444' };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  let text = '';
  if (days > 0) text = days + 'd ' + hours + 'h ' + mins + 'm';
  else if (hours > 0) text = hours + 'h ' + mins + 'm ' + secs + 's';
  else text = mins + 'm ' + secs + 's';
  let color = '#22c55e';
  if (days <= 7) color = '#f59e0b';
  if (days <= 1) color = '#ef4444';
  return { text, sub: 'Expires: ' + exp.toLocaleDateString('en-GB'), color };
}

function showLicenseInfo(status) {
  document.getElementById('license-activate-section').style.display = 'none';
  document.getElementById('license-info-section').style.display = 'block';
  document.getElementById('license-key-display').textContent = status.key || 'N/A';
  const typeLabels = { lifetime: 'Lifetime License', '1year': '1 Year License', '6months': '6 Month License', '1month': '1 Month License', trial: 'Trial License', standard: 'Standard License' };
  document.getElementById('license-type-display').textContent = typeLabels[status.type] || 'License';
  updateCountdown(status.expiry);
  if (licenseCountdownInterval) clearInterval(licenseCountdownInterval);
  if (status.expiry) {
    licenseCountdownInterval = setInterval(() => updateCountdown(status.expiry), 1000);
  }
}

function updateCountdown(expiry) {
  const info = formatTimeRemaining(expiry);
  const countdownEl = document.getElementById('license-countdown');
  const expiryEl = document.getElementById('license-expiry-date');
  if (countdownEl) { countdownEl.textContent = info.text; countdownEl.style.background = 'linear-gradient(135deg, ' + info.color + ', #00d4ff)'; countdownEl.style.webkitBackgroundClip = 'text'; countdownEl.style.webkitTextFillColor = 'transparent'; }
  if (expiryEl) expiryEl.textContent = info.sub;
}

async function checkLicense() {
  try {
    const status = await electronAPI.checkLicenseStatus();
    licenseStatus = status;
    if (status.active) {
      isLicensed = true;
      showLicenseInfo(status);
      updateDashboardLicense(status);
      document.getElementById('license-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      return true;
    }
    if (status.status === 'expired') {
      isLicensed = false;
      document.getElementById('license-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      showExpiredBanner(status);
      return false;
    }
    document.getElementById('license-screen').style.display = 'flex';
    document.getElementById('license-activate-section').style.display = 'block';
    document.getElementById('license-info-section').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    return false;
  } catch (e) {
    document.getElementById('license-screen').style.display = 'flex';
    document.getElementById('license-activate-section').style.display = 'block';
    document.getElementById('license-info-section').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    return false;
  }
}

function showExpiredBanner(status) {
  const existing = document.getElementById('expired-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'expired-banner';
  banner.innerHTML = '<div class="expired-banner-content"><span class="expired-icon">🔒</span><span>الكود انتهى — بعض الميزات مقفلة</span><button onclick="document.getElementById(\'license-screen\').style.display=\'flex\';document.getElementById(\'license-activate-section\').style.display=\'block\';document.getElementById(\'license-info-section\').style.display=\'none\';">تجديد الكود</button></div>';
  document.body.prepend(banner);
  const style = document.createElement('style');
  style.textContent = '#expired-banner{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#dc2626,#b91c1c);padding:10px 20px;box-shadow:0 2px 10px rgba(0,0,0,0.5);}#expired-banner .expired-banner-content{display:flex;align-items:center;justify-content:center;gap:12px;font-family:Cairo,sans-serif;color:#fff;font-weight:700;font-size:0.95em;}#expired-banner button{background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:6px 18px;border-radius:8px;cursor:pointer;font-family:Cairo,sans-serif;font-weight:700;transition:all 0.2s;}#expired-banner button:hover{background:rgba(255,255,255,0.35);}.expired-icon{font-size:1.2em;}.locked-overlay{position:absolute;inset:0;background:rgba(10,10,26,0.92);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;border-radius:16px;}.locked-overlay .lock-icon{font-size:3em;margin-bottom:16px;}.locked-overlay .lock-text{color:#fff;font-family:Cairo,sans-serif;font-size:1.3em;font-weight:700;margin-bottom:8px;}.locked-overlay .lock-sub{color:#94a3b8;font-family:Cairo,sans-serif;font-size:0.9em;margin-bottom:20px;}.locked-overlay .lock-btn{background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;color:#fff;padding:12px 32px;border-radius:12px;cursor:pointer;font-family:Cairo,sans-serif;font-size:1em;font-weight:700;transition:all 0.3s;}.locked-overlay .lock-btn:hover{transform:scale(1.05);box-shadow:0 0 20px rgba(124,58,237,0.5);}';
  document.head.appendChild(style);
}

function isPagePaid(page) {
  return PAID_PAGES.includes(page);
}

function showLockOverlay(pageEl) {
  const existing = pageEl.querySelector('.locked-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.className = 'locked-overlay';
  overlay.innerHTML = '<div class="lock-icon">🔒</div><div class="lock-text">هذا القسم مقفل</div><div class="lock-sub">aktivate license to unlock all features</div><button class="lock-btn" onclick="document.getElementById(\'license-screen\').style.display=\'flex\';document.getElementById(\'license-activate-section\').style.display=\'block\';document.getElementById(\'license-info-section\').style.display=\'none\';">Activate License</button>';
  pageEl.style.position = 'relative';
  pageEl.appendChild(overlay);
}

async function activateLicense() {
  const key = document.getElementById('license-key-input').value.trim();
  const msgEl = document.getElementById('license-msg');
  const btn = document.getElementById('activate-btn');

  if (!key) {
    msgEl.innerHTML = '<div style="color:#ef4444; padding:8px; background:rgba(239,68,68,0.1); border-radius:6px;">Please enter a license key</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Activating...';
  msgEl.innerHTML = '<div style="color:#888;">Validating key...</div>';

  try {
    const result = await electronAPI.validateLicense(key);
    if (result.valid) {
      isLicensed = true;
      msgEl.innerHTML = '<div style="color:#22c55e; padding:8px; background:rgba(34,197,94,0.1); border-radius:6px;">License activated successfully!</div>';
      setTimeout(() => {
        showLicenseInfo(result);
        updateDashboardLicense(result);
        document.getElementById('license-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        const eb = document.getElementById('expired-banner');
        if (eb) eb.remove();
        document.querySelectorAll('.locked-overlay').forEach(o => o.remove());
        navigateTo(currentPage);
      }, 1000);
    } else {
      let errorMsg = 'Invalid license key';
      if (result.reason === 'key_not_found') errorMsg = 'This key does not exist';
      else if (result.reason === 'key_revoked') errorMsg = 'This key has been revoked';
      else if (result.reason === 'key_expired') errorMsg = 'This key has expired';
      else if (result.reason === 'max_devices_reached') errorMsg = 'Maximum devices reached for this key';
      else if (result.reason === 'device_mismatch') errorMsg = 'This key is locked to a different device';
      else if (result.reason === 'device_banned') errorMsg = 'This device is banned';
      else if (result.reason === 'offline') errorMsg = 'Cannot verify key (offline). Try again later.';
      else if (result.reason === 'invalid_format') errorMsg = 'Invalid key format. Use: CJ-XXXX-XXXX-XXXX';
      msgEl.innerHTML = '<div style="color:#ef4444; padding:8px; background:rgba(239,68,68,0.1); border-radius:6px;">' + errorMsg + '</div>';
    }
  } catch (e) {
    msgEl.innerHTML = '<div style="color:#ef4444; padding:8px; background:rgba(239,68,68,0.1); border-radius:6px;">Error validating key. Check your connection.</div>';
  }

  btn.disabled = false;
  btn.textContent = 'Activate';
}

async function deactivateLicense() {
  if (!confirm('Are you sure you want to deactivate this license?')) return;
  try {
    await electronAPI.deactivateLicense();
    isLicensed = false;
    if (licenseCountdownInterval) clearInterval(licenseCountdownInterval);
    document.getElementById('license-screen').style.display = 'flex';
    document.getElementById('license-activate-section').style.display = 'block';
    document.getElementById('license-info-section').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('license-key-input').value = '';
  } catch (e) {}
}

document.getElementById('license-key-input').addEventListener('input', function(e) {
  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  if (val.length > 0 && !val.startsWith('CJ-')) {
    if (val.startsWith('CJ')) val = 'CJ-' + val.substring(5);
  }
  e.target.value = val;
});

if (electronAPI.securityAlert) {
  electronAPI.securityAlert((type) => {
    const reasons = {
      debugger: 'Debugger detected',
      integrity: 'Application integrity compromised',
      license: 'License revoked',
      banned: 'This device has been banned'
    };
    const msg = reasons[type] || 'Security violation detected';
    document.body.innerHTML = ''
      + '<div id="security-lock" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'background:#0a0a1a;color:#ef4444;font-family:sans-serif;user-select:none;">'
      + '<div style="font-size:4em;margin-bottom:20px;">&#128274;</div>'
      + '<div style="font-size:1.6em;font-weight:bold;margin-bottom:10px;">' + msg + '</div>'
      + '<div style="font-size:1em;color:#999;">Application will close automatically.</div>'
      + '</div>';
    document.addEventListener('contextmenu', (e) => e.preventDefault(), true);
    document.addEventListener('keydown', (e) => e.preventDefault(), true);
    try { electronAPI.close(); } catch (e) {}
  });
}

function updateDashboardLicense(status) {
  const keyEl = document.getElementById('dashLicenseKey');
  const typeEl = document.getElementById('dashLicenseType');
  const cdEl = document.getElementById('dashLicenseCountdown');
  const expEl = document.getElementById('dashLicenseExpiry');
  if (!keyEl) return;
  keyEl.textContent = status.key || 'N/A';
  const typeLabels = { lifetime: 'Lifetime', '1year': '1 Year', '6months': '6 Months', '1month': '1 Month', trial: 'Trial', standard: 'Standard' };
  typeEl.textContent = typeLabels[status.type] || 'License';
  const info = formatTimeRemaining(status.expiry);
  cdEl.textContent = info.text;
  cdEl.style.background = 'linear-gradient(135deg, ' + info.color + ', #00d4ff)';
  cdEl.style.webkitBackgroundClip = 'text';
  cdEl.style.webkitTextFillColor = 'transparent';
  expEl.textContent = info.sub;
}

async function loadAppVersion() {
  try {
    const version = await window.electronAPI.getAppVersion();
    if (!version) return;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    setText('app-version', 'v' + version);
    setText('activity-version', 'CJ OPTIMIZER v' + version);
    setText('footer-version', 'CJ OPTIMIZER v' + version);
  } catch (e) {}
}

async function checkForUpdates() {
  const btn = document.getElementById('check-update-btn');
  if (btn) { btn.textContent = '⏳ Checking...'; btn.disabled = true; }
  try {
    const result = await window.electronAPI.checkForUpdates();
    if (result && result.version) {
      showToast('Update v' + result.version + ' found — downloading now...', 'info');
    } else {
      showToast('You are up to date — no update available', 'info');
    }
  } catch (e) {
    showToast('Could not check for updates — try again later', 'info');
  } finally {
    if (btn) { btn.textContent = '🔄 Check Update'; btn.disabled = false; }
  }
}

async function selectRegion() {
  try {
    const region = await window.electronAPI.openRegionSelector();
    if (region) {
      document.getElementById('regionX').value = region.x;
      document.getElementById('regionY').value = region.y;
      document.getElementById('regionW').value = region.width;
      document.getElementById('regionH').value = region.height;
      showToast('Region selected: ' + region.width + 'x' + region.height);
    }
  } catch (e) {
    showToast('Region selection cancelled');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { checkLicense(); loadAppVersion(); });
} else {
  checkLicense(); loadAppVersion();
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    navigateTo(page);
  });
});

function toggleNavSection(el) {
  el.classList.toggle('collapsed');
  const group = el.nextElementSibling;
  if (group && group.classList.contains('nav-items-group')) {
    group.classList.toggle('collapsed');
  }
}

// ==================== DISCORD RPC ====================
async function initDiscordRpc() {
  const toggle = document.getElementById('activityToggle');
  const saved = localStorage.getItem('discordActivityEnabled');
  if (saved === '0') {
    toggle.checked = false;
    document.getElementById('discordActivity').classList.add('hidden');
  }
  if (toggle.checked) {
    await startDiscordRpc();
  }
  updateRpcBadge();
}

async function startDiscordRpc() {
  const badge = document.getElementById('rpcBadge');
  const indicator = document.getElementById('rpcIndicator');
  if (badge) badge.textContent = 'جاري الاتصال...';
  try {
    const res = await window.electronAPI.discordRpcStart();
    if (res.status === 'connected') {
      if (badge) badge.textContent = '🟢 متصل';
      if (indicator) indicator.textContent = '🟢';
    } else if (res.status === 'disabled') {
      if (badge) badge.textContent = '⚪ متوقف';
      if (indicator) indicator.textContent = '';
    } else {
      if (badge) badge.textContent = '🔴 غير متصل';
      if (indicator) indicator.textContent = '';
    }
  } catch (e) {
    if (badge) badge.textContent = '🔴 خطأ';
  }
}

async function stopDiscordRpc() {
  const badge = document.getElementById('rpcBadge');
  const indicator = document.getElementById('rpcIndicator');
  try {
    await window.electronAPI.discordRpcStop();
    if (badge) badge.textContent = '⚪ متوقف';
    if (indicator) indicator.textContent = '';
  } catch (e) {}
}

async function updateRpcBadge() {
  try {
    const status = await window.electronAPI.discordRpcStatus();
    const badge = document.getElementById('rpcBadge');
    const indicator = document.getElementById('rpcIndicator');
    if (status.connected) {
      if (badge) badge.textContent = '🟢 متصل';
      if (indicator) indicator.textContent = '🟢';
    } else if (!status.enabled) {
      if (badge) badge.textContent = '⚪ متوقف';
      if (indicator) indicator.textContent = '';
    } else {
      if (badge) badge.textContent = '🔴 غير متصل';
      if (indicator) indicator.textContent = '';
    }
  } catch (e) {}
}

function toggleActivity() {
  const on = document.getElementById('activityToggle').checked;
  const el = document.getElementById('discordActivity');
  if (el) el.classList.toggle('hidden', !on);
  localStorage.setItem('discordActivityEnabled', on ? '1' : '0');
  window.electronAPI.discordRpcToggle(on);
  if (on) {
    startDiscordRpc();
  } else {
    stopDiscordRpc();
  }
}

let _navDebounce = false;
let _loadedPages = {};
function navigateTo(page) {
  if (_navDebounce) return;
  _navDebounce = true;
  setTimeout(() => _navDebounce = false, 100);

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const navItem = document.querySelector(`[data-page="${page}"]`);
  const pageEl = document.getElementById(`page-${page}`);
  if (navItem) navItem.classList.add('active');
  if (pageEl) pageEl.classList.add('active');
  currentPage = page;

  if (isPagePaid(page) && !isLicensed) {
    if (pageEl) {
      showLockOverlay(pageEl);
      pageEl.classList.add('active');
    }
    return;
  }

  if (pageEl) {
    const lock = pageEl.querySelector('.locked-overlay');
    if (lock) lock.remove();
  }

  if (page === 'dashboard') { loadDashboard(); }
  if (page === 'monitor') { startMonitoring(); loadSystemInfo(); }
  else { stopMonitoring(); }
  if (page === 'stutter') loadStutterFixes();
  if (page === 'ram') loadRamInfo();
  if (page === 'disk') { loadDiskHealth(); loadSsdTweaks(); }
  if (page === 'fps') { loadVisualTweaks(); }
  if (page === 'mousefix') { loadInputLagTweaks(); }
  if (page === 'turboboost') { loadNetTurboTweaks(); }
  if (page === 'winupdate') { loadWinUpdateStatus(); }
  if (page === 'power') loadPowerPlans();
  if (page === 'startup') loadStartupItems();
  if (page === 'restore') loadRestorePoints();
  if (page === 'processes') loadProcesses('cpu');
  if (page === 'defender') loadDefenderStatus();
  if (page === 'bsod') loadBSODReports();
  if (page === 'netmon') loadNetworkInfo();
  if (page === 'services') loadServices();
  if (page === 'benchmark') loadBenchInfo();
  if (page === 'sysinfo') loadFullSystemInfo();
  if (page === 'uninstall') loadInstalledApps();
  if (page === 'diskanalyzer') scanGamesForDisk();
  if (page === 'netoptimize') loadNetworkTweaks();
  if (page === 'games') { loadProfilesList(); }
  if (page === 'gpu') loadGPUInfo();
  if (page === 'privacy') loadPrivacyTweaks();
  if (page === 'temp') refreshTemps();
  if (page === 'ctxmenu') loadContextMenu();
  if (page === 'browsrclean') loadBrowserSizes();
  if (page === 'gametranslator') loadTranslatorScreens();
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.background = type === 'success' ? 'linear-gradient(135deg, #00c8ff, #aa44ff)' : type === 'error' ? 'linear-gradient(135deg, #ff3366, #ff6b6b)' : 'linear-gradient(135deg, #aa44ff, #ff44cc)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  let result = '';
  if (days > 0) result += days + ' يوم ';
  if (hours > 0) result += hours + ' ساعة ';
  result += mins + ' دقيقة';
  return result;
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const stats = await window.electronAPI.getLiveStats();
    const info = await window.electronAPI.getSystemInfo();
    document.getElementById('heroCpu').textContent = stats.cpu + '%';
    document.getElementById('heroRam').textContent = stats.memory + '%';
    document.getElementById('heroDisk').textContent = stats.disk + '%';
    document.getElementById('heroOs').textContent = info.platform;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ==================== SYSTEM MONITOR ====================
async function loadSystemInfo() {
  try {
    const info = await window.electronAPI.getSystemInfo();
    const stats = await window.electronAPI.getLiveStats();

    document.getElementById('sys-hostname').textContent = info.hostname;
    document.getElementById('sys-platform').textContent = info.platform.toUpperCase();
    document.getElementById('sys-arch').textContent = info.arch;
    document.getElementById('sys-cpu-model').textContent = info.cpu.model;
    document.getElementById('sys-cpu-cores').textContent = info.cpu.cores + ' نواة';
    document.getElementById('sys-cpu-speed').textContent = info.cpu.speed + ' MHz';
    document.getElementById('sys-mem-total').textContent = formatBytes(info.memory.total);
    document.getElementById('sys-mem-used').textContent = formatBytes(info.memory.used);
    document.getElementById('sys-mem-pct').textContent = info.memory.percentage + '%';
    document.getElementById('sys-gpu').textContent = info.gpu;
    document.getElementById('sys-uptime').textContent = formatUptime(info.uptime);
    document.getElementById('sys-mem-live').textContent = stats.memoryUsed + ' / ' + stats.memoryTotal;
  } catch (error) {
    console.error('Error loading system info:', error);
  }
}

function startMonitoring() {
  if (monitorInterval) return;
  updateMonitor();
  monitorInterval = setInterval(updateMonitor, 2000);
}

function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

async function updateMonitor() {
  try {
    const stats = await window.electronAPI.getLiveStats();
    document.getElementById('cpuBar').style.width = stats.cpu + '%';
    document.getElementById('cpuValue').textContent = stats.cpu + '%';
    document.getElementById('memBar').style.width = stats.memory + '%';
    document.getElementById('memValue').textContent = stats.memory + '%';
    document.getElementById('diskBar').style.width = stats.disk + '%';
    document.getElementById('diskValue').textContent = stats.disk + '%';
    document.getElementById('sys-mem-live').textContent = stats.memoryUsed + ' / ' + stats.memoryTotal;
  } catch (error) {
    console.error('Monitor error:', error);
  }
}

// ==================== STUTTER FIX ====================
async function loadStutterFixes() {
  const container = document.getElementById('stutterFixes');
  try {
    const fixes = await window.electronAPI.getStutterFixes();
    container.innerHTML = '';
    fixes.forEach(fix => {
      const card = document.createElement('div');
      card.className = 'stutter-card';
      card.innerHTML = `
        <div class="stutter-check">
          <input type="checkbox" checked data-fix="${fix.id}">
          <span class="checkmark"></span>
        </div>
        <div class="stutter-info">
          <div class="stutter-name">${fix.name}</div>
          <div class="stutter-desc">${fix.description}</div>
        </div>
        <div class="stutter-badge">${fix.commandsCount} تعديل</div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><p>خطأ في تحميل الإصلاحات</p></div>';
  }
}

async function applyFullStutterFix() {
  const options = {};
  document.querySelectorAll('#stutterFixes input[type="checkbox"]').forEach(cb => {
    options[cb.dataset.fix] = cb.checked;
  });

  if (confirm('هل تريد تطبيق إصلاح الفريمات؟\nسيتم تطبيق تعديلات آمنة على النظام.')) {
    showToast('جاري تطبيق إصلاح الفريمات...', 'info');
    const results = await window.electronAPI.applyStutterFix(options);
    const successCount = results.filter(r => r.status === 'success').length;
    showToast(`تم تطبيق ${successCount} من ${results.length} إصلاح بنجاح!`, 'success');
  }
}

async function revertStutterFix() {
  if (confirm('هل تريد إعادة تعيين إصلاحات الفريمات؟')) {
    showToast('جاري إعادة التعيين...', 'info');
    const results = await window.electronAPI.revertStutterFix();
    showToast(`تمت إعادة ${results.filter(r => r.status === 'success').length} إصلاح`, 'success');
  }
}

async function fixStutter() {
  if (confirm('تطبيق إصلاح الفريمات الشامل؟')) {
    showToast('جاري إصلاح الفريمات...', 'info');
    const results = await window.electronAPI.applyStutterFix({});
    const successCount = results.filter(r => r.status === 'success').length;
    showToast(`تم تطبيق ${successCount} إصلاح! أعد تشغيل الجهاز للتطبيق الكامل.`, 'success');
  }
}

// ==================== FPS BOOST ====================
async function applyFpsBoost() {
  const options = {};
  document.querySelectorAll('#fpsTweaks input[type="checkbox"]').forEach(cb => {
    options[cb.dataset.tweak] = cb.checked;
  });
  showToast('جاري تطبيق التحسينات...');
  const results = await window.electronAPI.applyFpsBoost(options);
  const successCount = results.filter(r => r.status === 'success').length;
  showToast(`تم تطبيق ${successCount} من ${results.length} تحسين`);
}

async function revertFpsBoost() {
  showToast('جاري إعادة التعيين...');
  const results = await window.electronAPI.revertFpsBoost();
  showToast(`تم إعادة ${results.filter(r => r.status === 'success').length} تحسين`);
}

// ==================== GAME SETTINGS ====================
function selectPreset(preset) {
  selectedPreset = preset;
  document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`preset-${preset}`).classList.add('selected');
}

async function scanGames() {
  const list = document.getElementById('gamesList');
  list.innerHTML = '<div class="loading">جاري البحث عن الألعاب...</div>';
  try {
    scannedGames = await window.electronAPI.scanGames();
    list.innerHTML = '';
    if (scannedGames.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎮</div><p>لم يتم العثور على ألعاب</p><p style="font-size:12px;margin-top:8px;color:var(--text-secondary)">جرب اضافة لعبة يدوياً بالزرار تحت</p></div>';
    } else {
      const withConfigs = scannedGames.filter(g => g.configs.length > 0).length;
      const header = document.createElement('div');
      header.className = 'games-header';
      header.innerHTML = `<span>تم العثور على ${scannedGames.length} لعبة (${withConfigs} بملفات إعدادات)</span><span style="color:var(--text-secondary);font-size:12px;">سيتم تطبيق تحسينات حقيقية على النظام أيضاً</span>`;
      list.appendChild(header);

      scannedGames.forEach((game, index) => {
        const configsInfo = game.configs.length > 0
          ? `${game.configs.length} ملف إعدادات`
          : 'بدون ملفات إعدادات';
        const item = document.createElement('div');
        item.className = 'game-item' + (game.configs.length === 0 ? ' no-config' : '');
        item.innerHTML = `
          <div class="game-info">
            <div class="game-name">${game.name}</div>
            <div class="game-platform">${game.platform} | ${configsInfo}</div>
          </div>
          <div class="game-actions">
            <button class="btn-apply-preset" onclick="applyPresetToGame(${index})">تطبيق ${getPresetName()}</button>
            <button class="btn-revert-game" onclick="revertGame(${index})">إعادة</button>
          </div>
        `;
        list.appendChild(item);
      });
    }
  } catch (error) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في البحث عن الألعاب</p></div>';
  }
}

async function addGameManually() {
  try {
    const game = await window.electronAPI.selectGameFolder();
    if (!game) return;
    const exists = scannedGames.find(g => g.path === game.path);
    if (exists) { showToast('اللعبة مضافة بالفعل', 'error'); return; }
    scannedGames.push(game);
    renderGamesList();
    showToast(`تمت إضافة ${game.name}`, 'success');
  } catch (error) {
    showToast('فشل إضافة اللعبة', 'error');
  }
}

function renderGamesList() {
  const list = document.getElementById('gamesList');
  list.innerHTML = '';
  if (scannedGames.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎮</div><p>لم يتم العثور على ألعاب</p></div>';
    return;
  }
  scannedGames.forEach((game, index) => {
    const configsInfo = game.configs.length > 0 ? `${game.configs.length} ملف إعدادات` : 'بدون ملفات إعدادات';
    const item = document.createElement('div');
    item.className = 'game-item';
    item.innerHTML = `
      <div class="game-info">
        <div class="game-name">${game.name}</div>
        <div class="game-platform">${game.platform} | ${configsInfo}</div>
      </div>
      <div class="game-actions">
        <button class="btn-apply-preset" onclick="applyPresetToGame(${index})">تطبيق ${getPresetName()}</button>
        <button class="btn-revert-game" onclick="revertGame(${index})">إعادة</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function getPresetName() {
  const names = { performance: 'أقصى أداء', balanced: 'متوازن', competitive: 'تنافسي', quality: 'أقصى جودة' };
  return names[selectedPreset];
}

async function applyPresetToGame(index) {
  const game = scannedGames[index];
  showToast(`جاري تطبيق ${getPresetName()} على ${game.name}...`, 'info');

  const resultsContainer = document.getElementById('gamesResults');
  resultsContainer.innerHTML = '';

  const progress = document.getElementById('gamesProgress');
  const fill = document.getElementById('gamesFill');
  const text = document.getElementById('gamesText');
  if (progress) { progress.style.display = 'block'; fill.style.width = '30%'; text.textContent = 'جاري تطبيق تحسينات النظام...'; }

  try {
    const result = await window.electronAPI.applyGamePreset(game.path, selectedPreset, game.configs);
    fill.style.width = '100%';
    text.textContent = 'اكتمل!';

    if (result.status === 'success') {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'repair-result';
      summaryDiv.style.cssText = 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:16px;margin-bottom:16px;';
      summaryDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:24px;">✅</span>
          <div>
            <div style="font-weight:700;color:#22c55e;font-size:16px;">تم تطبيق ${result.preset}</div>
            <div style="color:var(--text-secondary);font-size:12px;">${result.presetDesc} — ${result.successTweaks} من ${result.totalTweaks} تعديل</div>
          </div>
        </div>
      `;

      if (result.systemResults && result.systemResults.length > 0) {
        const sysTitle = document.createElement('div');
        sysTitle.style.cssText = 'font-weight:700;color:var(--text-secondary);margin:12px 0 8px;font-size:14px;';
        sysTitle.textContent = '⚙️ تحسينات النظام المطبقة:';
        summaryDiv.appendChild(sysTitle);
        result.systemResults.forEach(item => {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          summaryDiv.appendChild(div);
        });
      }

      if (result.configResults && result.configResults.length > 0) {
        const cfgTitle = document.createElement('div');
        cfgTitle.style.cssText = 'font-weight:700;color:var(--text-secondary);margin:12px 0 8px;font-size:14px;';
        cfgTitle.textContent = '📄 ملفات الإعدادات المعدلة:';
        summaryDiv.appendChild(cfgTitle);
        result.configResults.forEach(item => {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.file}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          summaryDiv.appendChild(div);
        });
      }

      resultsContainer.appendChild(summaryDiv);
      showToast(`تم تطبيق ${result.preset} بنجاح`, 'success');
    } else {
      showToast('فشل تطبيق الإعدادات', 'error');
    }
  } catch (error) {
    fill.style.width = '100%';
    text.textContent = 'فشل';
    showToast('حدث خطأ: ' + error.message, 'error');
  }

  setTimeout(() => { if (progress) progress.style.display = 'none'; }, 5000);
}

async function revertGame(index) {
  const game = scannedGames[index];
  showToast(`جاري إعادة إعدادات ${game.name}...`, 'info');
  const result = await window.electronAPI.revertGameConfigs(game.path);
  showToast(result.message, result.status === 'success' ? 'success' : 'error');
}

// ==================== BLOATWARE REMOVER ====================
async function loadBloatware() {
  const list = document.getElementById('bloatwareList');
  list.innerHTML = '<div class="loading">جاري فحص البرامج المثبتة...</div>';
  try {
    const installed = await window.electronAPI.getInstalledBloatware();
    list.innerHTML = '';
    if (installed.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>لا توجد برامج bloatware مثبتة!</p></div>';
      return;
    }
    const categories = {};
    installed.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });
    for (const [cat, items] of Object.entries(categories)) {
      const catTitle = document.createElement('div');
      catTitle.style.cssText = 'font-weight:700;color:var(--text-secondary);margin:14px 0 8px;font-size:15px;';
      catTitle.textContent = cat === 'تطبيقات' ? '📱 تطبيقات' : cat === 'ألعاب' ? '🎮 ألعاب' : cat === 'متصفحات' ? '🌐 متصفحات' : `📦 ${cat}`;
      list.appendChild(catTitle);
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'clean-card';
        card.innerHTML = `
          <div class="clean-icon">${item.category === 'ألعاب' ? '🎮' : item.category === 'متصفحات' ? '🌐' : '📱'}</div>
          <div class="clean-info">
            <div class="clean-name">${item.name}</div>
            <div class="clean-desc">${item.packages ? item.packages.length + ' حزمة' : 'مثبت'}</div>
          </div>
          <button class="btn-clean" onclick="uninstallSingleBloatware('${item.name}','${item.pkg}')" style="background:rgba(239,68,68,0.2);color:#ef4444;">إزالة</button>
        `;
        list.appendChild(card);
      });
    }
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في الفحص</p></div>';
  }
}

async function uninstallSingleBloatware(name, pkg) {
  if (!confirm(`إزالة ${name}؟`)) return;
  showToast(`جاري إزالة ${name}...`, 'info');
  try {
    const result = await window.electronAPI.uninstallBloatware(pkg.replace('*', ''));
    const success = result.filter(r => r.status === 'success').length;
    if (success > 0) {
      showToast(`تمت إزالة ${name}`, 'success');
      loadBloatware();
    } else {
      showToast(`فشلت إزالة ${name}`, 'error');
    }
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

async function uninstallAllBloatware() {
  if (!confirm('إزالة جميع برامج bloatware؟\nقد تستغرق العملية دقيقة.')) return;
  showToast('جاري إزالة الكل...', 'info');
  try {
    const results = await window.electronAPI.uninstallAllBloatware();
    const success = results.filter(r => r.status === 'success').length;
    showToast(`تمت إزالة ${success} برنامج بنجاح`, 'success');
    loadBloatware();
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

async function resetAllGameTweaks() {
  if (!confirm('هل تريد إعادة كل شيء للوضع الأصلي؟\nسيتم إعادة جميع تعديلات النظام (الريجستري، الخدمات، خطط الطاقة، BCDEdit).')) return;

  showToast('جاري إعادة كل شيء للوضع الأصلي...', 'info');
  const resultsContainer = document.getElementById('gamesResults');
  resultsContainer.innerHTML = '';
  const progress = document.getElementById('gamesProgress');
  const fill = document.getElementById('gamesFill');
  const text = document.getElementById('gamesText');
  if (progress) { progress.style.display = 'block'; fill.style.width = '30%'; text.textContent = 'جاري إعادة التعديلات...'; }

  try {
    const result = await window.electronAPI.resetAllGameSettings();
    fill.style.width = '100%';
    text.textContent = 'اكتمل!';

    if (result.status === 'success' && result.results) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'repair-result';
      summaryDiv.style.cssText = 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:12px;padding:16px;margin-bottom:16px;';
      summaryDiv.innerHTML = `<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:24px;">↩️</span><div><div style="font-weight:700;color:#22c55e;font-size:16px;">تم إعادة ${result.results.length} تعديل</div><div style="color:var(--text-secondary);font-size:12px;">كل شيء رجع للوضع الأصلي</div></div></div>`;
      result.results.forEach(item => {
        const div = document.createElement('div');
        div.className = 'repair-result';
        div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
        summaryDiv.appendChild(div);
      });
      resultsContainer.appendChild(summaryDiv);
      showToast('تم إعادة كل شيء للوضع الأصلي', 'success');
    }
  } catch (error) {
    showToast('حدث خطأ: ' + error.message, 'error');
  }
  setTimeout(() => { if (progress) progress.style.display = 'none'; }, 5000);
}

// ==================== DRIVERS ====================
async function loadDrivers() {
  const list = document.getElementById('driversList');
  list.innerHTML = '<div class="loading">جاري تحميل التعريفات...</div>';
  try {
    const drivers = await window.electronAPI.getDrivers();
    list.innerHTML = '';
    if (drivers.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>لا توجد تعريفات</p></div>';
      return;
    }
    drivers.forEach(driver => {
      const item = document.createElement('div');
      item.className = 'driver-item';
      item.innerHTML = `
        <div class="driver-info">
          <h4>${driver.name}</h4>
          <p>${driver.manufacturer} | ${driver.version}</p>
        </div>
        <button class="btn-update" onclick="updateDriver('${driver.deviceId}')">تحديث</button>
      `;
      list.appendChild(item);
    });
  } catch (error) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل التعريفات</p></div>';
  }
}

async function updateDriver(deviceId) {
  showToast('جاري تحديث التعريف...');
  const result = await window.electronAPI.updateDriver(deviceId);
  showToast(result.message, result.status === 'success' ? 'success' : 'error');
}

// ==================== SYSTEM CLEAN ====================
async function cleanAll() {
  showToast('جاري تنظيف النظام...');
  const results = await window.electronAPI.cleanSystem();
  showToast(`تم تنظيف ${results.filter(r => r.status === 'success').length} عنصر`);
}

async function cleanTemp() {
  showToast('جاري حذف الملفات المؤقتة...');
  await window.electronAPI.cleanSystem();
  showToast('تم حذف الملفات المؤقتة');
}

async function cleanDNS() {
  showToast('جاري تنظيف DNS...');
  try {
    const result = await window.electronAPI.flushDns();
    if (Array.isArray(result)) {
      const failed = result.filter(r => r.status !== 'success');
      if (failed.length === 0) showToast('تم تنظيف DNS Cache بنجاح');
      else showToast('فشل: ' + failed.map(f => f.name).join('، '));
    } else if (result && result.status === 'success') {
      showToast('تم تنظيف DNS Cache بنجاح');
    } else {
      showToast('فشل تنظيف DNS');
    }
  } catch (e) {
    showToast('فشل تنظيف DNS');
  }
}

async function createBackup() {
  showToast('جاري إنشاء نقطة الاستعادة...');
  const result = await window.electronAPI.createRestorePoint();
  showToast(result.message, result.status === 'success' ? 'success' : 'error');
}

async function applyQuickBoost() {
  showToast('جاري التحسين السريع...');
  await window.electronAPI.applyFpsBoost({});
  showToast('تم التحسين السريع بنجاح');
}

async function quickClean() {
  showToast('جاري التنظيف السريع...');
  await window.electronAPI.cleanSystem();
  showToast('تم التنظيف السريع');
}

// ==================== TRANSLATE ====================
let translateHistory = [];

async function translateText() {
  const input = document.getElementById('translateInput').value.trim();
  const from = document.getElementById('translateFrom').value;
  const to = document.getElementById('translateTo').value;
  if (!input) { showToast('الرجاء إدخال نص للترجمة', 'error'); return; }
  showToast('جاري الترجمة...');
  try {
    const translated = await window.electronAPI.translateText(input, from, to);
    document.getElementById('translateOutput').value = translated;
    translateHistory.unshift({ original: input, translated: translated });
    if (translateHistory.length > 10) translateHistory.pop();
    updateTranslateHistory();
    showToast('تمت الترجمة بنجاح');
  } catch (error) {
    showToast('فشلت الترجمة', 'error');
  }
}

function updateTranslateHistory() {
  const historyDiv = document.getElementById('translateHistory');
  historyDiv.innerHTML = '';
  translateHistory.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-original">${item.original}</div>
      <div class="history-translated">${item.translated}</div>
    `;
    historyDiv.appendChild(historyItem);
  });
}

// ==================== WINDOWS REPAIR ====================
async function runWinRepair(type) {
  const progressEl = document.getElementById('winRepairProgress');
  const fillEl = document.getElementById('winRepairFill');
  const textEl = document.getElementById('winRepairText');
  const resultsEl = document.getElementById('winRepairResults');

  progressEl.classList.add('active');
  resultsEl.innerHTML = '';
  fillEl.style.width = '10%';
  textEl.textContent = 'جاري التحضير...';

  try {
    let results = [];
    const types = type === 'all' ? ['sfc', 'dism', 'registry', 'dll', 'windowsUpdate'] : [type];
    const totalSteps = types.length;
    let currentStep = 0;

    for (const t of types) {
      currentStep++;
      fillEl.style.width = ((currentStep / totalSteps) * 90 + 10) + '%';

      const labels = {
        sfc: 'فحص ملفات النظام (SFC)',
        dism: 'إصلاح صورة النظام (DISM)',
        registry: 'إصلاح السجل',
        dll: 'إصلاح ملفات DLL',
        windowsUpdate: 'إصلاح Windows Update'
      };
      textEl.textContent = 'جاري: ' + (labels[t] || t) + '...';

      let stepResults = [];
      if (t === 'sfc') {
        stepResults = await window.electronAPI.repairSFC();
      } else if (t === 'dism') {
        stepResults = await window.electronAPI.repairDISM();
      } else if (t === 'registry') {
        stepResults = await window.electronAPI.repairRegistry();
      } else if (t === 'dll') {
        stepResults = await window.electronAPI.repairDLL();
      } else if (t === 'windowsUpdate') {
        stepResults = await window.electronAPI.repairWindowsUpdate();
      }

      if (Array.isArray(stepResults)) {
        stepResults.forEach(item => results.push(item));
      }
    }

    fillEl.style.width = '100%';
    textEl.textContent = 'اكتمل الإصلاح!';

    resultsEl.innerHTML = '';
    results.forEach(item => {
      if (item.name) {
        const div = document.createElement('div');
        div.className = 'repair-result';
        div.innerHTML = `
          <span class="result-name">${item.name}</span>
          <span class="result-status ${item.status}">${item.status === 'success' ? 'تم بنجاح' : 'فشل'}</span>
        `;
        resultsEl.appendChild(div);
      }
    });

    showToast('تم إصلاح الويندوز بنجاح!', 'success');
  } catch (error) {
    textEl.textContent = 'حدث خطأ أثناء الإصلاح';
    showToast('حدث خطأ: ' + error.message, 'error');
  }

  setTimeout(() => progressEl.classList.remove('active'), 5000);
}

// ==================== INTERNET REPAIR ====================
async function runNetRepair(type) {
  const progressEl = document.getElementById('netRepairProgress');
  const fillEl = document.getElementById('netRepairFill');
  const textEl = document.getElementById('netRepairText');
  const resultsEl = document.getElementById('netRepairResults');

  progressEl.classList.add('active');
  resultsEl.innerHTML = '';
  fillEl.style.width = '10%';
  textEl.textContent = 'جاري التحضير...';

  try {
    let results = [];
    const types = type === 'all' ? ['tcpip', 'winsock', 'dns', 'adapters', 'firewall', 'slowInternet'] : [type];
    const totalSteps = types.length;
    let currentStep = 0;

    for (const t of types) {
      currentStep++;
      fillEl.style.width = ((currentStep / totalSteps) * 90 + 10) + '%';

      const labels = {
        tcpip: 'إعادة ضبط TCP/IP',
        winsock: 'إصلاح Winsock',
        dns: 'إصلاح DNS',
        adapters: 'إصلاح محولات الشبكة',
        firewall: 'إصلاح جدار الحماية',
        slowInternet: 'تحسين سرعة الإنترنت'
      };
      textEl.textContent = 'جاري: ' + (labels[t] || t) + '...';

      let result = null;
      if (t === 'tcpip') result = await window.electronAPI.resetTCP();
      else if (t === 'winsock') result = await window.electronAPI.resetWinsock();
      else if (t === 'dns') {
        const r1 = await window.electronAPI.flushDNS();
        const r2 = await window.electronAPI.optimizeDNS();
        result = [...(r1 || []), ...(r2 || [])];
      }
      else if (t === 'adapters') result = await window.electronAPI.fixNetworkAdapters();
      else if (t === 'firewall') result = await window.electronAPI.resetFirewall();
      else if (t === 'slowInternet') result = await window.electronAPI.fixSlowInternet();

      if (Array.isArray(result)) {
        result.forEach(f => results.push(f));
      }
    }

    fillEl.style.width = '100%';
    textEl.textContent = 'اكتمل الإصلاح!';

    resultsEl.innerHTML = '';
    results.forEach(item => {
      if (item.name) {
        const div = document.createElement('div');
        div.className = 'repair-result';
        div.innerHTML = `
          <span class="result-name">${item.name}</span>
          <span class="result-status ${item.status}">${item.status === 'success' ? 'تم بنجاح' : 'فشل'}</span>
        `;
        resultsEl.appendChild(div);
      }
    });

    showToast('تم إصلاح الإنترنت بنجاح!', 'success');
  } catch (error) {
    textEl.textContent = 'حدث خطأ أثناء الإصلاح';
    showToast('حدث خطأ: ' + error.message, 'error');
  }

  setTimeout(() => progressEl.classList.remove('active'), 5000);
}

// ==================== OPTIMIZE ALL ====================
document.getElementById('optimizeAll').addEventListener('click', async () => {
  if (confirm('هل تريد تطبيق جميع التحسينات؟\nسيتم تطبيق إصلاح الفريمات + تحسين FPS + تنظيف النظام + تنظيف RAM')) {
    showToast('جاري تطبيق جميع التحسينات...', 'info');
    try {
      const report = await window.electronAPI.runFullOptimization();
      showToast(`اكتمل! تم ${report.successFixes} بنجاح من أصل ${report.totalFixes}`, 'success');
    } catch (e) {
      showToast('حدث خطأ أثناء التحسين', 'error');
    }
  }
});

// ==================== GAME MODE ====================
let gameModeActive = false;
let selectedProcesses = [];

async function loadRunningProcesses() {
  const section = document.getElementById('processSelectorSection');
  const list = document.getElementById('runningProcessesList');
  if (!section || !list) return;
  try {
    const procs = await window.electronAPI.getRunningProcesses();
    list.innerHTML = '';
    if (!procs || procs.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    procs.forEach(proc => {
      const div = document.createElement('div');
      div.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 14px; cursor:pointer; transition:all 0.2s;';
      const memText = proc.memory > 0 ? `${proc.memory} MB` : '';
      div.innerHTML = `<label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-family:Cairo,sans-serif;">
        <input type="checkbox" data-proc="${proc.name.replace('.exe', '')}" style="accent-color:#7c3aed; width:16px; height:16px;" />
        <div><div style="font-size:13px; font-weight:700; color:#e2e8f0;">${proc.name}</div><div style="font-size:11px; color:#64748b;">${proc.title || 'خلفية'} ${memText ? '• ' + memText : ''}</div></div>
      </label>`;
      div.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const cb = div.querySelector('input');
        cb.checked = !cb.checked;
        updateProcessSelection();
      });
      div.querySelector('input').addEventListener('change', updateProcessSelection);
      list.appendChild(div);
    });
  } catch (e) {
    section.style.display = 'none';
  }
}

function updateProcessSelection() {
  selectedProcesses = [];
  document.querySelectorAll('#runningProcessesList input[type="checkbox"]:checked').forEach(cb => {
    selectedProcesses.push(cb.dataset.proc);
  });
}

function selectAllProcesses() {
  const cbs = document.querySelectorAll('#runningProcessesList input[type="checkbox"]');
  const allChecked = Array.from(cbs).every(cb => cb.checked);
  cbs.forEach(cb => cb.checked = !allChecked);
  updateProcessSelection();
}

async function toggleGameMode() {
  const btn = document.getElementById('btnGameMode');
  const title = document.getElementById('gameModeTitle');
  const progress = document.getElementById('gameModeProgress');
  const fill = document.getElementById('gameModeFill');
  const text = document.getElementById('gameModeText');
  const results = document.getElementById('gameModeResults');

  if (gameModeActive) {
    btn.textContent = '🔄 جاري الإيقاف...';
    btn.disabled = true;
    const res = await window.electronAPI.deactivateGameMode();
    gameModeActive = false;
    btn.textContent = '🚀 تفعيل وضع الألعاب';
    btn.disabled = false;
    title.textContent = 'وضع الألعاب غير مفعّل';
    results.innerHTML = '';
    if (res.results) {
      res.results.forEach(item => {
        if (item.name) {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          results.appendChild(div);
        }
      });
    }
    showToast('تم إيقاف وضع الألعاب', 'info');
    return;
  }

  progress.style.display = 'block';
  fill.style.width = '20%';
  text.textContent = 'جاري تحميل البرامج الشغّالة...';
  btn.textContent = '⏳ جاري التحميل...';
  btn.disabled = true;

  await loadRunningProcesses();
  fill.style.width = '50%';
  text.textContent = 'اختر البرامج اللي تبي تقفلها ثم اضغط "تفعيل"';

  btn.textContent = '🚀 تفعيل وضع الألعاب';
  btn.disabled = false;
  progress.style.display = 'none';

  const origText = btn.textContent;
  btn.textContent = '🚀 تفعيل وضع الألعاب';
  btn.onclick = async () => {
    progress.style.display = 'block';
    fill.style.width = '50%';
    text.textContent = 'جاري تفعيل وضع الألعاب...';
    btn.textContent = '⏳ جاري التفعيل...';
    btn.disabled = true;
    try {
      updateProcessSelection();
      const res = await window.electronAPI.activateGameMode(selectedProcesses);
      fill.style.width = '100%';
      text.textContent = 'تم تفعيل وضع الألعاب!';
      gameModeActive = true;
      btn.textContent = '⏹️ إيقاف وضع الألعاب';
      btn.disabled = false;
      title.textContent = 'وضع الألعاب مفعّل!';
      results.innerHTML = '';
      if (res.results) {
        res.results.forEach(item => {
          if (item.name) {
            const div = document.createElement('div');
            div.className = 'repair-result';
            div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
            results.appendChild(div);
          }
        });
      }
      showToast('تم تفعيل وضع الألعاب!', 'success');
      btn.onclick = toggleGameMode;
    } catch (e) {
      text.textContent = 'فشل التفعيل';
      btn.textContent = '🚀 تفعيل وضع الألعاب';
      btn.disabled = false;
      btn.onclick = toggleGameMode;
    }
  };
}

// ==================== RAM OPTIMIZER ====================
async function loadRamInfo() {
  try {
    const info = await window.electronAPI.getRamInfo();
    document.getElementById('ramTotal').textContent = info.total + ' MB';
    document.getElementById('ramUsed').textContent = info.used + ' MB';
    document.getElementById('ramFree').textContent = info.free + ' MB';
    document.getElementById('ramPercent').textContent = info.percentage + '%';
  } catch (e) {
    console.error('Error loading RAM info:', e);
  }
}

async function cleanRam() {
  const progress = document.getElementById('ramProgress');
  const fill = document.getElementById('ramFill');
  const text = document.getElementById('ramText');
  const results = document.getElementById('ramResults');

  progress.style.display = 'block';
  fill.style.width = '30%';
  text.textContent = 'جاري تنظيف الذاكرة...';
  results.innerHTML = '';

  try {
    fill.style.width = '60%';
    const res = await window.electronAPI.cleanRam();
    fill.style.width = '100%';
    text.textContent = `اكتمل! تم تحرير ${res.freed || 0} MB`;

    if (res.results) {
      res.results.forEach(item => {
        if (item.name) {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          results.appendChild(div);
        }
      });
    }
    await loadRamInfo();
    showToast('تم تنظيف الذاكرة بنجاح!', 'success');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }

  setTimeout(() => progress.style.display = 'none', 3000);
}

async function startAutoRamClean() {
  const interval = parseInt(document.getElementById('autoCleanInterval')?.value || '30000');
  try {
    await window.electronAPI.startAutoClean(interval);
    document.getElementById('btnStartAutoClean').style.display = 'none';
    document.getElementById('btnStopAutoClean').style.display = 'flex';
    document.getElementById('autoCleanStatus').textContent = 'التنظيف التلقائي: شغال 🟢';
    document.getElementById('autoCleanStatus').style.color = '#00ff88';
  } catch (e) { showToast('فشل تشغيل التنظيف التلقائي', 'error'); }
}

async function stopAutoRamClean() {
  try {
    await window.electronAPI.stopAutoClean();
    document.getElementById('btnStartAutoClean').style.display = 'flex';
    document.getElementById('btnStopAutoClean').style.display = 'none';
    document.getElementById('autoCleanStatus').textContent = 'التنظيف التلقائي: متوقف';
    document.getElementById('autoCleanStatus').style.color = 'var(--text-secondary)';
  } catch (e) { showToast('فشل إيقاف التنظيف', 'error'); }
}

function updateRamStatsFromMemory(mem) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('ramTotal', (mem.totalMB / 1024).toFixed(1) + ' GB');
  set('ramUsed', (mem.usedMB / 1024).toFixed(1) + ' GB');
  set('ramFree', (mem.freeMB / 1024).toFixed(1) + ' GB');
  set('ramPercent', mem.usagePct + '%');
}

// Listen for auto-clean updates
if (window.electronAPI.onAutoCleanUpdate) {
  window.electronAPI.onAutoCleanUpdate((data) => {
    if (data.status === 'tick' && data.memory) {
      updateRamStatsFromMemory(data.memory);
      const pct = document.getElementById('ramPercent');
      if (pct) {
        const val = parseInt(data.memory.usagePct);
        pct.textContent = val + '%';
        pct.style.color = val > 80 ? '#ef4444' : val > 60 ? '#f59e0b' : '#00ff88';
      }
    }
    if (data.status === 'stopped') {
      document.getElementById('btnStartAutoClean').style.display = 'flex';
      document.getElementById('btnStopAutoClean').style.display = 'none';
    }
  });
}

// ==================== DISK HEALTH ====================
async function loadDiskHealth() {
  const usageGrid = document.getElementById('diskUsageGrid');
  const healthList = document.getElementById('diskHealthList');

  usageGrid.innerHTML = '<div class="loading">جاري تحميل...</div>';
  healthList.innerHTML = '<div class="loading">جاري تحميل...</div>';

  try {
    const usage = await window.electronAPI.getDiskUsage();
    usageGrid.innerHTML = '';
    usage.forEach(vol => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <div class="stat-icon">💿</div>
        <div class="stat-info">
          <div class="stat-label">${vol.drive}</div>
          <div class="stat-value">${vol.free} GB / ${vol.total} GB</div>
        </div>
      `;
      usageGrid.appendChild(card);
    });

    const health = await window.electronAPI.getDiskHealth();
    healthList.innerHTML = '';
    if (health.length === 0) {
      healthList.innerHTML = '<div class="empty-state"><div class="empty-icon">💿</div><p>لا توجد بيانات</p></div>';
    }
    health.forEach(disk => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      const healthColor = disk.health === 'Healthy' ? 'var(--green)' : 'var(--red)';
      div.innerHTML = `
        <div class="driver-info">
          <h4>${disk.name}</h4>
          <p>${disk.size} | ${disk.type}</p>
        </div>
        <span class="result-status ${disk.health === 'Healthy' ? 'success' : 'failed'}">${disk.health === 'Healthy' ? '✓ سليم' : '⚠ ' + disk.health}</span>
      `;
      healthList.appendChild(div);
    });
  } catch (e) {
    usageGrid.innerHTML = '<div class="empty-state"><p>خطأ في تحميل البيانات</p></div>';
    healthList.innerHTML = '<div class="empty-state"><p>خطأ في تحميل البيانات</p></div>';
  }
}

async function checkDiskErrors() {
  const results = document.getElementById('diskResults');
  results.innerHTML = '<div class="loading">جاري فحص القرص... قد يستغرق هذا بضع دقائق</div>';
  try {
    const res = await window.electronAPI.checkDiskErrors('C:');
    results.innerHTML = '';
    res.forEach(item => {
      const div = document.createElement('div');
      div.className = 'repair-result';
      div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
      results.appendChild(div);
    });
    showToast('تم فحص القرص', 'success');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== POWER PLANS ====================
async function loadPowerPlans() {
  const list = document.getElementById('powerPlansList');
  list.innerHTML = '<div class="loading">جاري تحميل خطط الطاقة...</div>';

  try {
    const plans = await window.electronAPI.getPowerPlans();
    list.innerHTML = '';
    if (plans.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>لا توجد خطط طاقة</p></div>';
    }
    plans.forEach(plan => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `
        <div class="driver-info">
          <h4>${plan.name}</h4>
          <p>${plan.guid}</p>
        </div>
        ${plan.active ? '<span class="result-status success">مفعّلة</span>' : `<button class="btn-apply-preset" onclick="activatePlan('${plan.guid}')">تفعيل</button>`}
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل خطط الطاقة</p></div>';
  }
}

async function activatePlan(guid) {
  try {
    await window.electronAPI.setActivePlan(guid);
    showToast('تم تفعيل خطة الطاقة', 'success');
    loadPowerPlans();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

async function createGamingPowerPlan() {
  showToast('جاري إنشاء خطة الألعاب...', 'info');
  try {
    const res = await window.electronAPI.createGamingPlan();
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    loadPowerPlans();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

async function createSaverPowerPlan() {
  showToast('جاري تفعيل خطة توفير الطاقة...', 'info');
  try {
    const res = await window.electronAPI.createPowerSaverPlan();
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    loadPowerPlans();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== STARTUP MANAGER ====================
async function loadStartupItems() {
  const list = document.getElementById('startupList');
  list.innerHTML = '<div class="loading">جاري تحميل قائمة بدء التشغيل...</div>';

  try {
    const items = await window.electronAPI.getStartupItems();
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🚀</div><p>لا توجد برامج في بدء التشغيل</p></div>';
    }
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `
        <div class="driver-info" style="flex:1;">
          <h4>${item.name}</h4>
          <p style="font-size:10px; word-break:break-all;">${item.command}</p>
          <p style="color:var(--accent); font-size:10px;">${item.scope}</p>
        </div>
        <button class="btn-revert-game" onclick="removeStartupItem('${item.registryKey.replace(/\\/g, '\\\\')}', '${item.name.replace(/'/g, "\\'")}')">🗑️ حذف</button>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل القائمة</p></div>';
  }
}

async function removeStartupItem(registryKey, name) {
  if (!confirm(`هل تريد حذف ${name} من بدء التشغيل؟`)) return;
  try {
    await window.electronAPI.removeStartupItem(registryKey, name);
    showToast(`تم حذف ${name}`, 'success');
    loadStartupItems();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== RESTORE POINTS ====================
async function loadRestorePoints() {
  const list = document.getElementById('restoreList');
  list.innerHTML = '<div class="loading">جاري تحميل نقاط الاستعادة...</div>';

  try {
    const points = await window.electronAPI.getRestorePoints();
    list.innerHTML = '';
    if (points.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏮️</div><p>لا توجد نقاط استعادة</p></div>';
    }
    points.forEach(point => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `
        <div class="driver-info" style="flex:1;">
          <h4>${point.description}</h4>
          <p>${point.date} | ${point.type}</p>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل نقاط الاستعادة</p></div>';
  }
}

async function createNewRestorePoint() {
  const results = document.getElementById('restoreResults');
  showToast('جاري إنشاء نقطة الاستعادة...', 'info');
  try {
    const res = await window.electronAPI.createRestorePoint('CJ Restore Point');
    const div = document.createElement('div');
    div.className = 'repair-result';
    div.innerHTML = `<span class="result-name">${res.message}</span><span class="result-status ${res.status}">${res.status === 'success' ? 'تم' : 'فشل'}</span>`;
    results.appendChild(div);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== NETWORK OPTIMIZER ====================
async function loadNetworkTweaks() {
  const list = document.getElementById('networkTweaksList');
  if (!list) return;
  try {
    const tweaks = await window.electronAPI.getNetworkTweaks();
    list.innerHTML = '';
    tweaks.forEach(tweak => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; transition:all 0.2s;';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <span style="font-size:1.3em;">⚡</span>
          <div style="font-size:14px; font-weight:700; color:#e2e8f0;">${tweak.name}</div>
        </div>
        <div style="font-size:12px; color:#94a3b8; line-height:1.6;">${tweak.description}</div>
        <div style="margin-top:10px; display:flex; align-items:center; gap:8px;">
          <button onclick="applySingleNetworkTweak('${tweak.id}', this)" style="background:linear-gradient(135deg,#06b6d4,#2563eb); border:none; color:#fff; padding:6px 16px; border-radius:8px; cursor:pointer; font-family:Cairo,sans-serif; font-size:11px; font-weight:700; transition:all 0.2s;">تطبيق</button>
          <span class="tweak-status" style="font-size:11px; color:#64748b;"></span>
        </div>`;
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '<div style="color:#64748b; text-align:center;">فشل تحميل التحسينات</div>';
  }
}

async function applySingleNetworkTweak(id, btn) {
  const statusEl = btn.parentElement.querySelector('.tweak-status');
  btn.disabled = true;
  btn.textContent = 'جاري...';
  statusEl.textContent = '';
  try {
    const fnMap = {
      'dns_optimize': 'optimizeNetworkDNS',
      'nagle_disable': 'disableNagle',
      'throttle_disable': 'disableThrottling',
      'qos_optimize': 'optimizeQoS',
      'tcp_autotune': 'optimizeTCPAutotune',
      'interrupt_moderation': 'disableInterruptModeration',
      'game_priority': 'optimizeGamePriority'
    };
    const fn = fnMap[id];
    if (fn && window.electronAPI[fn]) {
      const results = await window.electronAPI[fn]();
      const success = results && results.some(r => r.status === 'success');
      statusEl.textContent = success ? '✅ تم' : '❌ فشل';
      statusEl.style.color = success ? '#22c55e' : '#ef4444';
    }
  } catch (e) {
    statusEl.textContent = '❌ خطأ';
    statusEl.style.color = '#ef4444';
  }
  btn.disabled = false;
  btn.textContent = 'تطبيق';
}

async function applyAllNetworkOptimizations() {
  const btn = document.getElementById('btnApplyAllNet');
  const progress = document.getElementById('netOptProgress');
  const fill = document.getElementById('netOptFill');
  const text = document.getElementById('netOptText');
  const results = document.getElementById('netOptResults');

  btn.disabled = true;
  btn.textContent = '⏳ جاري التحسين...';
  progress.style.display = 'block';
  fill.style.width = '30%';
  text.textContent = 'جاري تطبيق جميع التحسينات...';
  results.innerHTML = '';

  try {
    fill.style.width = '60%';
    const res = await window.electronAPI.applyAllNetworkOptimizations();
    fill.style.width = '100%';
    text.textContent = 'تم تطبيق جميع التحسينات!';
    if (res) {
      res.forEach(item => {
        if (item.name) {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          results.appendChild(div);
        }
      });
    }
    showToast('تم تحسين الشبكة بنجاح!', 'success');
    setTimeout(() => progress.style.display = 'none', 3000);
  } catch (e) {
    text.textContent = 'فشل التحسين';
    showToast('حدث خطأ أثناء التحسين', 'error');
  }
  btn.disabled = false;
  btn.textContent = '🚀 تطبيق الكل';
}

async function revertNetworkOptimizations() {
  const results = document.getElementById('netOptResults');
  try {
    const res = await window.electronAPI.revertNetworkOptimizations();
    results.innerHTML = '';
    if (res) {
      res.forEach(item => {
        if (item.name) {
          const div = document.createElement('div');
          div.className = 'repair-result';
          div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`;
          results.appendChild(div);
        }
      });
    }
    showToast('تمت إعادة الإعدادات الافتراضية', 'info');
  } catch (e) {
    showToast('حدث خطأ', 'error');
  }
}

// ==================== SPEED TEST ====================
async function startSpeedTest() {
  const btn = document.getElementById('btnSpeedTest');
  const progress = document.getElementById('speedTestProgress');
  const fill = document.getElementById('speedTestFill');
  const text = document.getElementById('speedTestText');
  const resultsDiv = document.getElementById('speedTestResults');
  const details = document.getElementById('speedTestDetails');

  btn.textContent = '⏳ جاري الاختبار...';
  btn.disabled = true;
  progress.style.display = 'block';
  resultsDiv.style.display = 'none';
  details.innerHTML = '';

  try {
    fill.style.width = '20%';
    text.textContent = 'جاري اختبار الباينق...';
    const result = await window.electronAPI.runSpeedTest();

    fill.style.width = '100%';
    text.textContent = 'اكتمل الاختبار!';

    document.getElementById('speedDownload').textContent = result.download + ' Mbps';
    document.getElementById('speedUpload').textContent = result.upload + ' Mbps';
    document.getElementById('speedPing').textContent = result.ping + ' ms';
    document.getElementById('speedRating').textContent = result.rating;
    resultsDiv.style.display = 'block';

    if (result.details) {
      result.details.forEach(item => {
        const div = document.createElement('div');
        div.className = 'repair-result';
        div.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.value}</span>`;
        details.appendChild(div);
      });
    }
  } catch (e) {
    text.textContent = 'حدث خطأ أثناء الاختبار';
    showToast('حدث خطأ: ' + e.message, 'error');
  }

  btn.textContent = '🚀 إعادة الاختبار';
  btn.disabled = false;
  setTimeout(() => progress.style.display = 'none', 3000);
}

// ==================== PROCESS MANAGER ====================
async function loadProcesses(sortBy = 'cpu') {
  const list = document.getElementById('processList');
  const statsDiv = document.getElementById('processStats');
  list.innerHTML = '<div class="loading">جاري تحميل العمليات...</div>';

  try {
    const stats = await window.electronAPI.getProcessStats();
    statsDiv.innerHTML = `
      <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-info"><div class="stat-label">عدد العمليات</div><div class="stat-value">${stats.TotalProcesses || 0}</div></div></div>
      <div class="stat-card"><div class="stat-icon">💾</div><div class="stat-info"><div class="stat-label">الذاكرة الكلية</div><div class="stat-value">${stats.TotalMemoryMB || 0} MB</div></div></div>
      <div class="stat-card"><div class="stat-icon">⚡</div><div class="stat-info"><div class="stat-label">CPU المستخدم</div><div class="stat-value">${stats.TotalCPU || 0}%</div></div></div>
    `;

    const processes = await window.electronAPI.getProcesses(sortBy);
    list.innerHTML = '';

    const grouped = {};
    processes.forEach(p => {
      const name = p.name;
      if (!grouped[name]) grouped[name] = { ...p, count: 1, totalMemory: p.memory, totalCpu: p.cpu };
      else {
        grouped[name].count++;
        grouped[name].totalMemory += p.memory;
        grouped[name].totalCpu += p.cpu;
      }
    });

    const sorted = Object.values(grouped).sort((a, b) => sortBy === 'cpu' ? b.totalCpu - a.totalCpu : b.totalMemory - a.totalMemory);

    sorted.forEach(proc => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `
        <div class="driver-info" style="flex:1;">
          <h4>${proc.name}${proc.count > 1 ? ` (${proc.count})` : ''}</h4>
          <p>CPU: ${Math.round(proc.totalCpu * 100) / 100}% | RAM: ${Math.round(proc.totalMemory / 1024)} MB</p>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-apply-preset" onclick="killProc('${proc.name}')">🗑️ إنهاء</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل العمليات</p></div>';
  }
}

async function killProc(name) {
  if (!confirm(`هل تريد إنهاء عملية ${name}؟`)) return;
  try {
    await window.electronAPI.killProcessByName(name);
    showToast(`تم إنهاء ${name}`, 'success');
    loadProcesses(document.getElementById('processSort').value);
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== DEFENDER MANAGER ====================
async function loadDefenderStatus() {
  const statsDiv = document.getElementById('defenderStats');
  const tweaksDiv = document.getElementById('defenderTweaks');
  const exclusionsDiv = document.getElementById('defenderExclusions');

  try {
    const status = await window.electronAPI.getDefenderStatus();

    statsDiv.innerHTML = `
      <div class="stat-card"><div class="stat-icon">🛡️</div><div class="stat-info"><div class="stat-label">الحالة</div><div class="stat-value">${status.status === 'Active' ? 'مفعّل' : 'معطّل'}</div></div></div>
      <div class="stat-card"><div class="stat-icon">🔄</div><div class="stat-info"><div class="stat-label">آخر فحص</div><div class="stat-value" style="font-size:12px;">${status.lastScan}</div></div></div>
    `;

    tweaksDiv.innerHTML = '';
    const toggles = [
      { key: 'realtime', label: 'الحماية الفورية', value: status.realtime },
      { key: 'behavior', label: 'الحماية السلوكي', value: status.behavior },
      { key: 'onAccess', label: 'حماية الوصول', value: status.onAccess },
      { key: 'ioav', label: 'حماية IOAV', value: status.ioav },
      { key: 'scriptScanning', label: 'فحص السكريبت', value: status.scriptScanning }
    ];

    toggles.forEach(toggle => {
      const div = document.createElement('div');
      div.className = 'tweak-card';
      div.innerHTML = `
        <label class="tweak-toggle">
          <input type="checkbox" ${toggle.value ? 'checked' : ''} onchange="toggleDefenderSetting('${toggle.key}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <div>
          <div class="tweak-name">${toggle.label}</div>
          <div class="tweak-desc">${toggle.value ? 'مفعّل' : 'معطّل'}</div>
        </div>
      `;
      tweaksDiv.appendChild(div);
    });

    exclusionsDiv.innerHTML = '';
    if (status.exclusions.paths.length > 0) {
      status.exclusions.paths.forEach(p => {
        const div = document.createElement('div');
        div.className = 'driver-item';
        div.innerHTML = `
          <div class="driver-info" style="flex:1;"><h4>${p}</h4></div>
          <button class="btn-revert-game" onclick="removeDefenderExcl('${p.replace(/'/g, "\\'")}')">🗑️ حذف</button>
        `;
        exclusionsDiv.appendChild(div);
      });
    } else {
      exclusionsDiv.innerHTML = '<div class="empty-state"><p>لا توجد استثناءات</p></div>';
    }
  } catch (e) {
    statsDiv.innerHTML = '<div class="empty-state"><p>خطأ في تحميل حالة Defender</p></div>';
  }
}

async function toggleDefenderSetting(key, enable) {
  try {
    if (key === 'realtime') await window.electronAPI.toggleDefenderRealtime(enable);
    else if (key === 'behavior') await window.electronAPI.toggleDefenderBehavior(enable);
    showToast(enable ? 'تم التفعيل' : 'تم التعطيل', 'success');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

async function startDefenderScan(type) {
  const progress = document.getElementById('defenderScanProgress');
  const fill = document.getElementById('defenderScanFill');
  const text = document.getElementById('defenderScanText');
  const results = document.getElementById('defenderResults');

  progress.style.display = 'block';
  fill.style.width = '30%';
  text.textContent = type === 'full' ? 'جاري الفحص الشامل... قد يستغرق وقتاً...' : 'جاري الفحص السريع...';

  try {
    fill.style.width = '80%';
    const res = await window.electronAPI.startDefenderScan(type);
    fill.style.width = '100%';
    text.textContent = res.message;

    const div = document.createElement('div');
    div.className = 'repair-result';
    div.innerHTML = `<span class="result-name">${res.message}</span><span class="result-status ${res.status}">${res.status === 'success' ? 'تم' : 'فشل'}</span>`;
    results.appendChild(div);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    loadDefenderStatus();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }

  setTimeout(() => progress.style.display = 'none', 3000);
}

async function updateDefenderDefs() {
  showToast('جاري تحديث التعريفات...', 'info');
  try {
    const res = await window.electronAPI.updateDefenderDefinitions();
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

async function addDefenderExclusion() {
  const input = document.getElementById('defenderExclusionPath');
  const exclPath = input.value.trim();
  if (!exclPath) return showToast('أدخل مسار أولاً', 'error');

  try {
    const res = await window.electronAPI.addDefenderExclusion(exclPath);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    input.value = '';
    loadDefenderStatus();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

async function removeDefenderExcl(exclPath) {
  try {
    const res = await window.electronAPI.removeDefenderExclusion(exclPath);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    loadDefenderStatus();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== BSOD ANALYZER ====================
async function loadBSODReports() {
  const list = document.getElementById('bsodList');
  list.innerHTML = '<div class="loading">جاري تحميل تقارير BSOD...</div>';

  try {
    const reports = await window.electronAPI.getBSODReports();
    list.innerHTML = '';

    if (reports.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">💀</div><p>لا توجد تقارير — الجهاز مستقر!</p></div>';
      return;
    }

    reports.forEach(report => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `
        <div class="driver-info" style="flex:1;">
          <h4>${report.bugcheckCode || 'Minidump'}</h4>
          <p>${report.description || 'N/A'}</p>
          <p style="color:var(--text-secondary); font-size:10px;">${report.date} ${report.fileName ? '| ' + report.fileName : ''}</p>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل التقارير</p></div>';
  }
}

// ==================== DUPLICATE FINDER ====================
async function startDuplicateScan() {
  const btn = document.getElementById('btnFindDuplicates');
  const progress = document.getElementById('dupProgress');
  const fill = document.getElementById('dupFill');
  const text = document.getElementById('dupText');
  const resultsDiv = document.getElementById('dupResults');
  const list = document.getElementById('dupList');

  btn.textContent = '⏳ جاري البحث...';
  btn.disabled = true;
  progress.style.display = 'block';
  resultsDiv.style.display = 'none';
  list.innerHTML = '';

  try {
    fill.style.width = '30%';
    text.textContent = 'جاري مسح المجلدات...';

    const result = await window.electronAPI.findDuplicates();

    fill.style.width = '100%';
    text.textContent = 'اكتمل البحث!';

    document.getElementById('dupGroups').textContent = result.totalGroups;
    document.getElementById('dupFiles').textContent = result.totalFiles;
    document.getElementById('dupWasted').textContent = result.wastedSpace;
    resultsDiv.style.display = 'block';

    list.innerHTML = '';
    if (result.duplicates.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>لا توجد ملفات مكررة!</p></div>';
    }

    result.duplicates.forEach((group, idx) => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'flex-start';
      let filesHtml = group.files.map(f => `<div style="font-size:11px; color:var(--text-secondary); margin:2px 0;">${f.name} (${f.folder})</div>`).join('');
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div class="driver-info"><h4>مجموعة ${idx + 1} — ${group.size} × ${group.count} ملفات</h4></div>
          <button class="btn-revert-game" onclick="deleteDupGroup(${idx})">🗑️ حذف المكررات</button>
        </div>
        ${filesHtml}
      `;
      list.appendChild(div);
    });

    window._lastDuplicates = result;
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في البحث</p></div>';
  }

  btn.textContent = '🔍 بدء البحث';
  btn.disabled = false;
  setTimeout(() => progress.style.display = 'none', 2000);
}

async function deleteDupGroup(idx) {
  if (!window._lastDuplicates) return;
  const group = window._lastDuplicates.duplicates[idx];
  if (!group || group.files.length < 2) return;

  if (!confirm(`حذف ${group.files.length - 1} ملف مكرر؟`)) return;

  const filesToKeep = group.files[0].path;
  const filesToDelete = group.files.slice(1).map(f => f.path);

  try {
    const res = await window.electronAPI.deleteDuplicateFiles(filesToKeep, filesToDelete);
    showToast(res.message, 'success');
    startDuplicateScan();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== NETWORK MONITOR ====================
async function loadNetworkInfo() {
  const adaptersDiv = document.getElementById('netAdapters');
  const wifiDiv = document.getElementById('wifiList');
  const connDiv = document.getElementById('connList');

  adaptersDiv.innerHTML = '<div class="loading">جاري التحميل...</div>';

  try {
    const stats = await window.electronAPI.getNetworkStats();
    adaptersDiv.innerHTML = '';
    stats.forEach(a => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `<div class="stat-icon">📡</div><div class="stat-info"><div class="stat-label">${a.name}</div><div class="stat-value">${a.speed || 'N/A'}</div><div style="font-size:10px; color:var(--text-secondary);">↓${a.received} ↑${a.sent}</div></div>`;
      adaptersDiv.appendChild(card);
    });
  } catch (e) { adaptersDiv.innerHTML = ''; }

  try {
    const profiles = await window.electronAPI.getWifiProfiles();
    wifiDiv.innerHTML = '';
    if (profiles.length === 0) {
      wifiDiv.innerHTML = '<div class="empty-state"><p>لا توجد شبكات WiFi محفوظة</p></div>';
    }
    for (const profile of profiles) {
      const password = await window.electronAPI.getWifiPassword(profile);
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `<div class="driver-info" style="flex:1;"><h4>📶 ${profile}</h4><p>كلمة المرور: <strong>${password}</strong></p></div>`;
      wifiDiv.appendChild(div);
    }
  } catch (e) { wifiDiv.innerHTML = '<div class="empty-state"><p>خطأ</p></div>'; }

  try {
    const conns = await window.electronAPI.getActiveConnections();
    connDiv.innerHTML = '';
    const shown = conns.slice(0, 50);
    shown.forEach(c => {
      const div = document.createElement('div');
      div.className = 'driver-item';
      div.innerHTML = `<div class="driver-info" style="flex:1;"><h4>${c.process}</h4><p>${c.localAddress}:${c.localPort} → ${c.remoteAddress}:${c.remotePort}</p><p style="color:var(--accent); font-size:10px;">${c.state} | PID: ${c.pid}</p></div>`;
      connDiv.appendChild(div);
    });
  } catch (e) { connDiv.innerHTML = '<div class="empty-state"><p>خطأ</p></div>'; }
}

// ==================== SERVICE MANAGER ====================
let allServices = [];

async function loadServices() {
  const list = document.getElementById('serviceList');
  list.innerHTML = '<div class="loading">جاري تحميل الخدمات...</div>';

  try {
    allServices = await window.electronAPI.getServices();
    renderServices(allServices);
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل الخدمات</p></div>';
  }
}

function renderServices(services) {
  const list = document.getElementById('serviceList');
  list.innerHTML = '';
  const shown = services.slice(0, 200);
  shown.forEach(svc => {
    const div = document.createElement('div');
    div.className = 'driver-item';
    const statusColor = svc.status === 'Running' ? 'var(--green)' : svc.status === 'Stopped' ? 'var(--red)' : 'var(--orange)';
    div.innerHTML = `
      <div class="driver-info" style="flex:1;">
        <h4>${svc.displayName}</h4>
        <p style="font-size:10px;">${svc.name}</p>
      </div>
      <span style="font-size:11px; color:${statusColor}; margin-right:auto;">${svc.status === 'Running' ? '● تشغيل' : svc.status === 'Stopped' ? '● متوقف' : '● ' + svc.status}</span>
      <div style="display:flex; gap:4px;">
        ${svc.status !== 'Running' ? `<button class="btn-apply-preset" onclick="svcAction('start','${svc.name}')">▶️</button>` : `<button class="btn-revert-game" onclick="svcAction('stop','${svc.name}')">⏹️</button>`}
        <button class="btn-revert-game" onclick="svcAction('restart','${svc.name}')">🔄</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function filterServices() {
  const q = document.getElementById('serviceSearch').value.toLowerCase();
  const filtered = allServices.filter(s => s.displayName.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  renderServices(filtered);
}

async function svcAction(action, name) {
  try {
    let res;
    if (action === 'start') res = await window.electronAPI.startService(name);
    else if (action === 'stop') res = await window.electronAPI.stopService(name);
    else if (action === 'restart') res = await window.electronAPI.restartService(name);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
    loadServices();
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== CPU BENCHMARK ====================
async function loadBenchInfo() {
  try {
    const cpu = await window.electronAPI.getCpuInfo();
    document.getElementById('benchCpuName').textContent = cpu.name;
  } catch (e) {
    document.getElementById('benchCpuName').textContent = 'خطأ في تحميل معلومات المعالج';
  }
}

async function runBenchmark() {
  const btn = document.getElementById('btnBenchmark');
  const progress = document.getElementById('benchProgress');
  const fill = document.getElementById('benchFill');
  const text = document.getElementById('benchText');
  const resultsDiv = document.getElementById('benchResults');

  btn.textContent = '⏳ جاري الاختبار...';
  btn.disabled = true;
  progress.style.display = 'block';
  resultsDiv.style.display = 'none';

  try {
    fill.style.width = '20%'; text.textContent = 'اختبار الأعدادات...';
    await new Promise(r => setTimeout(r, 200));
    fill.style.width = '40%'; text.textContent = 'اختبار الأعدادات العشرية...';
    await new Promise(r => setTimeout(r, 200));
    fill.style.width = '60%'; text.textContent = 'اختبار النصوص...';
    await new Promise(r => setTimeout(r, 200));
    fill.style.width = '80%'; text.textContent = 'اختبار المصفوفات والخيوط...';

    const result = await window.electronAPI.runCpuBenchmark();

    fill.style.width = '100%'; text.textContent = 'اكتمل الاختبار!';

    document.getElementById('benchOverall').textContent = result.overall;
    document.getElementById('benchRating').textContent = result.rating;
    document.getElementById('benchThreads').textContent = `${result.cpu.cores} / ${result.cpu.threads}`;

    const detailsDiv = document.getElementById('benchDetails');
    detailsDiv.innerHTML = '';
    const labels = { integer: 'أعدادات صحيحة', float: 'أعدادات عشرية', string: 'معالجة نصوص', array: 'مصفوفات وفرز', multithread: 'متعدد النواة' };
    for (const [key, val] of Object.entries(result.scores)) {
      const div = document.createElement('div');
      div.className = 'tweak-card';
      div.innerHTML = `<div><div class="tweak-name">${labels[key] || key}</div><div class="tweak-desc">النتيجة: ${val.score} | الوقت: ${val.time}ms</div></div>`;
      detailsDiv.appendChild(div);
    }

    const compareDiv = document.getElementById('benchCompare');
    compareDiv.innerHTML = '';
    const maxScore = Math.max(result.overall, ...result.references.map(r => r.score));
    const allEntries = [...result.references, { name: '>>> معالجك <<<', score: result.overall }].sort((a, b) => b.score - a.score);
    allEntries.forEach((entry, idx) => {
      const isMe = entry.name.includes('معالجك');
      const pct = (entry.score / maxScore) * 100;
      const div = document.createElement('div');
      div.style.cssText = `margin:8px 0; padding:10px 14px; background:${isMe ? 'rgba(245,158,11,0.15)' : 'var(--bg-glass)'}; border:1px solid ${isMe ? 'var(--orange)' : 'var(--border-light)'}; border-radius:8px;`;
      div.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-size:12px; font-weight:${isMe ? '700' : '500'}; color:${isMe ? 'var(--orange)' : 'var(--text-primary)'};">#${idx + 1} ${entry.name}</span><span style="font-size:12px; font-weight:700;">${entry.score}</span></div><div class="monitor-bar"><div class="monitor-fill" style="width:${pct}%; background:${isMe ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'var(--gradient-1)'};"></div></div>`;
      compareDiv.appendChild(div);
    });

    resultsDiv.style.display = 'block';
  } catch (e) {
    text.textContent = 'حدث خطأ أثناء الاختبار';
    showToast('حدث خطأ: ' + e.message, 'error');
  }

  btn.textContent = '🚀 إعادة الاختبار';
  btn.disabled = false;
  setTimeout(() => progress.style.display = 'none', 3000);
}

// ==================== SYSTEM INFO ====================
async function loadFullSystemInfo() {
  const content = document.getElementById('sysInfoContent');
  content.innerHTML = '<div class="loading">جاري تحميل معلومات النظام...</div>';

  try {
    const info = await window.electronAPI.getFullSystemInfo();
    content.innerHTML = '';

    const sections = [
      { title: 'نظام التشغيل', icon: '💻', items: [
        { label: 'الاسم', value: info.os.hostname },
        { label: 'الإصدار', value: info.os.release },
        { label: 'النوع', value: info.os.arch },
        { label: 'وقت التشغيل', value: info.os.uptime },
        { label: 'التفعيل', value: info.os.activated },
        { label: 'البرامج المثبتة', value: info.os.installedApps + ' برنامج' }
      ]},
      { title: 'المعالج', icon: '⚡', items: [
        { label: 'الطراز', value: info.cpu.model },
        { label: 'النوى', value: info.cpu.cores + ' نواة / ' + info.cpu.threads + ' خيط' },
        { label: 'السرعة', value: info.cpu.speed + ' MHz' }
      ]},
      { title: 'الذاكرة', icon: '💾', items: [
        { label: 'الكلية', value: info.memory.total },
        { label: 'المستخدم', value: info.memory.used },
        { label: 'المتاح', value: info.memory.free },
        { label: 'النسبة', value: info.memory.percentage + '%' }
      ]},
      { title: 'كرت الشاشة', icon: '🖥️', items: info.gpu.map(g => ({ label: g.name, value: g.memory + ' | ' + g.driver })) },
      { title: 'اللوحة الأم', icon: '🔧', items: [
        { label: 'الشركة', value: info.motherboard.manufacturer },
        { label: 'الطراز', value: info.motherboard.product }
      ]},
      { title: 'البيوس', icon: '📋', items: [
        { label: 'الشركة', value: info.bios.manufacturer },
        { label: 'الإصدار', value: info.bios.version }
      ]}
    ];

    sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.style.cssText = 'margin-bottom:24px;';
      sectionDiv.innerHTML = `<h2 style="font-size:16px; margin-bottom:14px; color:var(--text-secondary);">${section.icon} ${section.title}</h2>`;
      const grid = document.createElement('div');
      grid.className = 'details-grid';
      section.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'detail-card';
        card.innerHTML = `<div><div class="detail-label">${item.label}</div><div class="detail-value">${item.value}</div></div>`;
        grid.appendChild(card);
      });
      sectionDiv.appendChild(grid);
      content.appendChild(sectionDiv);
    });
  } catch (e) {
    content.innerHTML = '<div class="empty-state"><p>خطأ في تحميل معلومات النظام</p></div>';
  }
}

// ==================== UNINSTALLER ====================
let allApps = [];

async function loadInstalledApps() {
  const list = document.getElementById('appList');
  list.innerHTML = '<div class="loading">جاري تحميل البرامج... قد يستغرق قليلاً</div>';

  try {
    allApps = await window.electronAPI.getInstalledApps();
    renderApps(allApps);
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><p>خطأ في تحميل البرامج</p></div>';
  }
}

function renderApps(apps) {
  const list = document.getElementById('appList');
  list.innerHTML = '';
  const shown = apps.slice(0, 200);
  shown.forEach((app, idx) => {
    const div = document.createElement('div');
    div.className = 'driver-item';
    div.innerHTML = `
      <div class="driver-info" style="flex:1;">
        <h4>${app.name}</h4>
        <p>${app.version} | ${app.publisher} | ${app.size}</p>
      </div>
      <button class="btn-revert-game" data-app-idx="${idx}">🗑️ إزالة</button>
    `;
    div.querySelector('button').addEventListener('click', () => {
      uninstallApp(app.name, app.uninstallString);
    });
    list.appendChild(div);
  });
}

function filterApps() {
  const q = document.getElementById('appSearch').value.toLowerCase();
  const filtered = allApps.filter(a => a.name.toLowerCase().includes(q) || a.publisher.toLowerCase().includes(q));
  renderApps(filtered);
}

async function uninstallApp(name, uninstallString) {
  if (!confirm(`هل تريد إزالة ${name}؟`)) return;
  try {
    const res = await window.electronAPI.uninstallApp(name, uninstallString);
    showToast(res.message, res.status === 'success' ? 'success' : 'error');
  } catch (e) {
    showToast('حدث خطأ: ' + e.message, 'error');
  }
}

// ==================== WINDOWS APPS UNINSTALLER (Store) ====================
let allStoreApps = [];
let selectedStoreApps = new Set();

function switchUninstallTab(tab) {
  document.getElementById('uninstallSectionApps').style.display = tab === 'apps' ? 'block' : 'none';
  document.getElementById('uninstallSectionStore').style.display = tab === 'store' ? 'block' : 'none';
  document.getElementById('uninstallTabApps').style.background = tab === 'apps' ? 'rgba(124,58,237,0.3)' : '';
  document.getElementById('uninstallTabStore').style.background = tab === 'store' ? 'rgba(124,58,237,0.3)' : '';
  if (tab === 'store') loadStoreApps();
}

async function loadStoreApps() {
  const list = document.getElementById('storeAppsList');
  const count = document.getElementById('storeAppsCount');
  if (!list) return;
  list.innerHTML = '<div class="loading">جاري تحميل تطبيقات Store...</div>';
  try {
    const [userApps, provApps] = await Promise.all([
      window.electronAPI.getAllStoreApps(),
      window.electronAPI.getAllProvisionedApps()
    ]);
    allStoreApps = userApps;
    const onlySystem = document.getElementById('storeShowSystemOnly')?.checked;
    let filtered = allStoreApps;
    if (onlySystem) {
      const provNames = new Set(provApps.map(p => p.name.toLowerCase()));
      filtered = allStoreApps.filter(a => provNames.has(a.name.toLowerCase()));
    }
    if (count) count.textContent = `${filtered.length} تطبيق`;
    if (!filtered || filtered.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>لا توجد تطبيقات Store مثبتة</p></div>';
      return;
    }
    selectedStoreApps.clear();
    list.innerHTML = filtered.map(app => `
      <div class="tweak-card" style="flex-direction:row;align-items:center;gap:12px;">
        <label class="tweak-toggle" style="margin:0;">
          <input type="checkbox" data-fullname="${app.fullName}" data-name="${app.name}" onchange="toggleStoreApp(this)">
          <span class="toggle-slider" style="transform:scale(0.8);"></span>
        </label>
        <div class="tweak-info" style="flex:1;">
          <div class="tweak-name">${app.name}</div>
          <div class="tweak-desc">${app.sizeMB > 0 ? app.sizeMB + ' MB' : 'حجم غير معروف'} — ${app.publisher ? app.publisher.substring(0,40) : 'غير معروف'}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>فشل تحميل التطبيقات</p></div>';
    console.error('Store apps load error:', e);
  }
}

function toggleStoreApp(checkbox) {
  if (checkbox.checked) {
    selectedStoreApps.add(checkbox.dataset.fullname);
  } else {
    selectedStoreApps.delete(checkbox.dataset.fullname);
  }
}

async function removeSelectedStoreApps() {
  if (selectedStoreApps.size === 0) { showToast('اختر تطبيقات أولاً', 'error'); return; }
  if (!confirm(`هل تريد إزالة ${selectedStoreApps.size} تطبيق؟`)) return;
  const apps = allStoreApps.filter(a => selectedStoreApps.has(a.fullName));
  try {
    const results = await window.electronAPI.removeMultipleStoreApps(apps);
    const success = results.filter(r => r.status === 'success').length;
    showToast(`تم إزالة ${success} من ${results.length} تطبيق`, success > 0 ? 'success' : 'error');
    loadStoreApps();
  } catch (e) {
    showToast('فشل الإزالة: ' + e.message, 'error');
  }
}

// ==================== DISK SPACE ANALYZER (Games) ====================
async function scanGamesForDisk() {
  const progress = document.getElementById('diskGameProgress');
  const fill = document.getElementById('diskGameFill');
  const text = document.getElementById('diskGameText');
  const results = document.getElementById('diskGameResults');
  const stats = document.getElementById('diskGameStats');
  const list = document.getElementById('diskGameList');

  results.style.display = 'none';
  progress.style.display = 'block';
  fill.style.width = '10%';
  text.textContent = 'جاري البحث عن الألعاب...';

  try {
    const games = await window.electronAPI.scanGamesForDisk();
    fill.style.width = '70%';
    text.textContent = 'جاري تحليل المساحات...';

    if (games.length === 0) {
      fill.style.width = '100%';
      text.textContent = 'لا توجد ألعاب';
      setTimeout(() => progress.style.display = 'none', 1000);
      return;
    }

    fill.style.width = '100%';
    text.textContent = 'تم التحليل!';
    setTimeout(() => progress.style.display = 'none', 500);

    const totalSize = games.reduce((s, g) => s + (g.size || 0), 0);
    stats.innerHTML = '';
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card';
    totalCard.innerHTML = `
      <div class="stat-icon">🎮</div>
      <div class="stat-info">
        <div class="stat-label">إجمالي الألعاب</div>
        <div class="stat-value">${games.length} لعبة</div>
      </div>
    `;
    stats.appendChild(totalCard);
    const sizeCard = document.createElement('div');
    sizeCard.className = 'stat-card';
    sizeCard.innerHTML = `
      <div class="stat-icon">💾</div>
      <div class="stat-info">
        <div class="stat-label">المساحة المستهلكة</div>
        <div class="stat-value">${formatSize(totalSize)}</div>
      </div>
    `;
    stats.appendChild(sizeCard);

    list.innerHTML = '';
    games.forEach((game, idx) => {
      const now = Date.now();
      const daysSince = (now - (game.lastPlayedTimestamp || 0)) / 86400000;

      let daysText;
      if (!game.lastPlayedTimestamp) {
        daysText = 'غير معروف';
      } else if (daysSince < 1) {
        daysText = 'اليوم';
      } else if (daysSince < 2) {
        daysText = 'منذ يوم';
      } else {
        daysText = `منذ ${Math.floor(daysSince)} يوم`;
      }

      let advice, adviceColor;
      if (daysSince > 180) {
        advice = 'احذفها';
        adviceColor = '#ef4444';
      } else if (daysSince > 60) {
        advice = 'يفضل حذفها';
        adviceColor = '#f59e0b';
      } else if (daysSince > 14) {
        advice = 'غير ضرورية';
        adviceColor = '#eab308';
      } else {
        advice = 'لا تحذف';
        adviceColor = '#10b981';
      }

      const div = document.createElement('div');
      div.className = 'driver-item';
      div.style.opacity = idx < 5 ? '1' : '0.7';
      div.innerHTML = `
        <div style="width:40px;height:40px;border-radius:8px;background:rgba(251,191,36,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🎮</div>
        <div class="driver-info" style="flex:1;margin:0 12px;">
          <h4 style="font-size:13px;color:var(--text-primary);margin:0 0 2px;">${game.name}</h4>
          <p style="font-size:10px;color:var(--text-secondary);margin:0;">
            ${game.platform} | ${formatSize(game.size)} | آخر لعب: ${daysText}
          </p>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <div class="monitor-bar" style="flex:1;height:4px;max-width:120px;">
              <div class="monitor-fill" style="width:${Math.min(100, (game.size / totalSize) * 100)}%;background:${adviceColor};"></div>
            </div>
          </div>
        </div>
        <span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;background:${adviceColor}20;color:${adviceColor};white-space:nowrap;">${advice}</span>
      `;
      list.appendChild(div);
    });

    results.style.display = 'block';
  } catch (e) {
    text.textContent = 'خطأ في التحليل';
    showToast('خطأ: ' + e.message, 'error');
    setTimeout(() => progress.style.display = 'none', 1500);
  }
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ==================== GPU OPTIMIZER ====================
async function loadGPUInfo() {
  const el = document.getElementById('gpuInfo');
  if (!el) return;
  try {
    const gpus = await window.electronAPI.getGPUInfo();
    el.innerHTML = gpus.map(g => `<div class="tweak-card" style="padding:14px;"><div style="font-weight:700; color:#e2e8f0; font-size:14px;">${g.name}</div><div style="font-size:12px; color:#94a3b8; margin-top:6px;">VRAM: ${g.memory} MB | Driver: ${g.driverVersion} | ${g.resolution} @ ${g.refreshRate}Hz</div></div>`).join('');
  } catch (e) { el.innerHTML = '<div style="color:#64748b;">GPU info unavailable</div>'; }
}
async function optimizeGPU() {
  const results = document.getElementById('gpuResults');
  results.innerHTML = '<div style="color:#94a3b8;">جاري...</div>';
  const res = await window.electronAPI.optimizeGPU();
  results.innerHTML = '';
  if (res) res.forEach(item => { const d = document.createElement('div'); d.className = 'repair-result'; d.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`; results.appendChild(d); });
  showToast('تم تحسين GPU', 'success');
}
async function revertGPU() {
  const results = document.getElementById('gpuResults');
  const res = await window.electronAPI.revertGPU();
  results.innerHTML = '';
  if (res) res.forEach(item => { const d = document.createElement('div'); d.className = 'repair-result'; d.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`; results.appendChild(d); });
  showToast('تمت إعادة GPU', 'info');
}

// ==================== MOUSE LATENCY ====================
async function optimizeMouse() {
  const results = document.getElementById('mouseResults');
  results.innerHTML = '<div style="color:#94a3b8;">جاري التحسين...</div>';
  const res = await window.electronAPI.optimizeMouse();
  results.innerHTML = '';
  if (res) res.forEach(item => { const d = document.createElement('div'); d.className = 'repair-result'; d.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`; results.appendChild(d); });
  showToast('تم تحسين الماوس', 'success');
}
async function revertMouse() {
  const results = document.getElementById('mouseResults');
  const res = await window.electronAPI.revertMouse();
  results.innerHTML = '';
  if (res) res.forEach(item => { const d = document.createElement('div'); d.className = 'repair-result'; d.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`; results.appendChild(d); });
  showToast('تمت إعادة الماوس', 'info');
}

// ==================== GAME TRANSLATOR ====================
let translatorRunning = false;

async function loadSsdTweaks() {
  try {
    const tweaks = await window.electronAPI.getSsdTweaks();
    const container = document.getElementById('ssdTweaksList');
    if (!container) return;
    if (!tweaks || tweaks.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">💿</div><p>لا توجد تعديلات متاحة</p></div>'; return; }
    container.innerHTML = tweaks.map(t => `<div class="tweak-card"><label class="tweak-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><div class="tweak-info"><div class="tweak-name">${t.name}</div><div class="tweak-desc">${t.desc}</div></div></div>`).join('');
  } catch (e) { console.error('SSD load error:', e); }
}
async function applyAllSsdTweaks() {
  const btn = document.querySelector('#page-disk .btn-primary');
  if (btn) btn.disabled = true;
  try {
    const results = await window.electronAPI.applyAllSsdTweaks();
    const container = document.getElementById('ssdTweaksList');
    if (!container) return;
    const success = results.filter(r => r.status === 'success').length;
    const total = results.length;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم بنجاح' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('SSD apply error:', e); }
  if (btn) btn.disabled = false;
}
async function revertAllSsdTweaks() {
  try {
    const results = await window.electronAPI.revertAllSsdTweaks();
    const container = document.getElementById('ssdTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('SSD revert error:', e); }
}

async function loadVisualTweaks() {
  try {
    const tweaks = await window.electronAPI.getVisualTweaks();
    const container = document.getElementById('visualTweaksList');
    if (!container) return;
    if (!tweaks || tweaks.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎨</div><p>لا توجد تعديلات</p></div>'; return; }
    container.innerHTML = tweaks.map(t => `<div class="tweak-card"><label class="tweak-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><div class="tweak-info"><div class="tweak-name">${t.name}</div><div class="tweak-desc">${t.desc}</div></div></div>`).join('');
  } catch (e) { console.error('Visual load error:', e); }
}
async function applyAllVisualTweaks() {
  try {
    const results = await window.electronAPI.applyAllVisualTweaks();
    const container = document.getElementById('visualTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('Visual apply error:', e); }
}
async function revertAllVisualTweaks() {
  try {
    const results = await window.electronAPI.revertAllVisualTweaks();
    const container = document.getElementById('visualTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('Visual revert error:', e); }
}

async function loadInputLagTweaks() {
  try {
    const tweaks = await window.electronAPI.getInputLagTweaks();
    const container = document.getElementById('inputLagTweaksList');
    if (!container) return;
    if (!tweaks || tweaks.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🖱️</div><p>لا توجد تعديلات</p></div>'; return; }
    container.innerHTML = tweaks.map(t => `<div class="tweak-card"><label class="tweak-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><div class="tweak-info"><div class="tweak-name">${t.name}</div><div class="tweak-desc">${t.desc}</div></div></div>`).join('');
  } catch (e) { console.error('InputLag load error:', e); }
}
async function applyAllInputLagFixes() {
  try {
    const results = await window.electronAPI.applyAllInputLagFixes();
    const container = document.getElementById('inputLagTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('InputLag apply error:', e); }
}
async function revertAllInputLagFixes() {
  try {
    const results = await window.electronAPI.revertAllInputLagFixes();
    const container = document.getElementById('inputLagTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('InputLag revert error:', e); }
}

async function loadNetTurboTweaks() {
  try {
    const tweaks = await window.electronAPI.getNetTurboboostTweaks();
    const container = document.getElementById('netTurboTweaksList');
    if (!container) return;
    if (!tweaks || tweaks.length === 0) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🚀</div><p>لا توجد تعديلات</p></div>'; return; }
    container.innerHTML = tweaks.map(t => `<div class="tweak-card"><label class="tweak-toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label><div class="tweak-info"><div class="tweak-name">${t.name}</div><div class="tweak-desc">${t.desc}</div></div></div>`).join('');
  } catch (e) { console.error('Turbo load error:', e); }
}
async function applyAllNetTurbo() {
  try {
    const results = await window.electronAPI.applyAllNetTurboboost();
    const container = document.getElementById('netTurboTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('Turbo apply error:', e); }
}
async function revertAllNetTurbo() {
  try {
    const results = await window.electronAPI.revertAllNetTurboboost();
    const container = document.getElementById('netTurboTweaksList');
    if (!container) return;
    container.innerHTML = results.map(r =>
      `<div class="tweak-card" style="border-right:3px solid ${r.status === 'success' ? '#00ff88' : '#ef4444'}">
        <div class="tweak-info">
          <div class="tweak-name">${r.name}</div>
          <div class="tweak-desc" style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'}">${r.status === 'success' ? '✅ تم' : '❌ فشل'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('Turbo revert error:', e); }
}

async function loadWinUpdateStatus() {
  try {
    const status = await window.electronAPI.getWindowsUpdateStatus();
    const container = document.getElementById('winUpdateStatusList');
    if (!container) return;
    container.innerHTML = status.map(s =>
      `<div class="tweak-card" style="border-right:3px solid ${s.blocked ? '#ef4444' : '#00ff88'}">
        <div class="tweak-info">
          <div class="tweak-name">${s.name}</div>
          <div class="tweak-desc" style="color:${s.blocked ? '#ef4444' : '#00ff88'}">${s.blocked ? '🔒 موقوفة' : '✅ شغالة'}</div>
        </div>
      </div>`
    ).join('');
  } catch (e) { console.error('WinUpdate status error:', e); }
}
async function blockWinUpdates() {
  const btn = document.querySelector('#page-winupdate .btn-hero');
  if (btn) btn.disabled = true;
  try {
    const results = await window.electronAPI.blockWindowsUpdate();
    const container = document.getElementById('winUpdateResults');
    if (container) {
      container.innerHTML = results.map(r =>
        `<div style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'};font-size:13px;margin-bottom:4px;">${r.status === 'success' ? '✅' : '❌'} ${r.cmd || r.status}</div>`
      ).join('');
    }
    loadWinUpdateStatus();
  } catch (e) { console.error('block error:', e); }
  if (btn) btn.disabled = false;
}
async function unblockWinUpdates() {
  try {
    const results = await window.electronAPI.unblockWindowsUpdate();
    const container = document.getElementById('winUpdateResults');
    if (container) {
      container.innerHTML = results.map(r =>
        `<div style="color:${r.status === 'success' ? '#00ff88' : '#ef4444'};font-size:13px;margin-bottom:4px;">${r.status === 'success' ? '✅' : '❌'} ${r.cmd || r.status}</div>`
      ).join('');
    }
    loadWinUpdateStatus();
  } catch (e) { console.error('unblock error:', e); }
}

// ==================== GAME FPS PROFILES ====================
async function loadProfilesList() {
  try {
    const profiles = await window.electronAPI.getGameFpsProfiles();
    const container = document.getElementById('fpsProfilesList');
    if (!container) return;
    const custom = profiles.filter(p => p.custom);
    if (custom.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>لا توجد بروفايلات مخصصة — احفظ الإعدادات الحالية كبروفايل</p></div>';
      return;
    }
    container.innerHTML = custom.map(p => `
      <div class="tweak-card" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="tweak-name">📁 ${p.name}</div>
          <div style="display:flex;gap:6px;">
            <button onclick="applyProfileById('${p.id}')" style="background:rgba(6,182,212,0.2);border:1px solid rgba(6,182,212,0.3);color:#06b6d4;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;">تطبيق</button>
            <button onclick="deleteProfileById('${p.id}')" style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);color:#ef4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:11px;">حذف</button>
          </div>
        </div>
        <div class="tweak-desc" style="font-size:11px;">
          ${Object.entries(p.settings || {}).filter(([,v]) => v).map(([k]) => k).join(' | ') || 'بدون إعدادات'}
        </div>
      </div>
    `).join('');
  } catch (e) { console.error('Profiles load error:', e); }
}

function getCurrentFpsSettings() {
  const checkboxes = document.querySelectorAll('#fpsTweaks input[type="checkbox"]');
  const settings = {};
  checkboxes.forEach(cb => {
    settings[cb.dataset.tweak] = cb.checked;
  });
  return settings;
}

async function saveCurrentAsProfile() {
  const name = prompt('اسم البروفايل الجديد:');
  if (!name || name.trim() === '') return;
  const settings = getCurrentFpsSettings();
  try {
    await window.electronAPI.saveGameFpsProfile(name.trim(), settings);
    showToast('تم حفظ البروفايل', 'success');
    loadProfilesList();
  } catch (e) { showToast('فشل الحفظ', 'error'); }
}

async function applyProfileById(id) {
  try {
    const profiles = await window.electronAPI.getGameFpsProfiles();
    const profile = profiles.find(p => p.id === id);
    if (!profile) { showToast('البروفايل غير موجود', 'error'); return; }
    const checkboxes = document.querySelectorAll('#fpsTweaks input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const val = profile.settings[cb.dataset.tweak];
      if (val !== undefined) cb.checked = val;
    });
    showToast(`تم تطبيق بروفايل: ${profile.name}`, 'success');
  } catch (e) { showToast('فشل تطبيق البروفايل', 'error'); }
}

async function deleteProfileById(id) {
  if (!confirm('حذف البروفايل؟')) return;
  try {
    await window.electronAPI.deleteGameFpsProfile(id);
    showToast('تم الحذف', 'success');
    loadProfilesList();
  } catch (e) { showToast('فشل الحذف', 'error'); }
}

async function resetProfilesToDefault() {
  if (!confirm('إعادة كل البروفايلات للافتراضي؟')) return;
  try {
    await window.electronAPI.resetGameFpsProfiles();
    showToast('تمت الإعادة', 'success');
    loadProfilesList();
  } catch (e) { showToast('فشل', 'error'); }
}

// ==================== FPS OVERLAY ====================
async function startFpsOverlay() {
  try {
    const result = await window.electronAPI.startFpsOverlay();
    document.getElementById('btnStartOverlay').style.display = 'none';
    document.getElementById('btnStopOverlay').style.display = 'flex';
    document.getElementById('overlayResults').innerHTML = '<div style="color:#00ff88;font-size:13px;">✅ الـ Overlay شغال — رح للعبتك وشوف الإحصائيات</div>';
  } catch (e) { showToast('فشل تشغيل الـ Overlay', 'error'); }
}
async function stopFpsOverlay() {
  try {
    await window.electronAPI.stopFpsOverlay();
    document.getElementById('btnStartOverlay').style.display = 'flex';
    document.getElementById('btnStopOverlay').style.display = 'none';
    document.getElementById('overlayResults').innerHTML = '<div style="color:var(--text-secondary);font-size:13px;">⏹️ تم إيقاف الـ Overlay</div>';
  } catch (e) { showToast('فشل إيقاف الـ Overlay', 'error'); }
}
async function toggleOverlayMouseMode() {
  const passthrough = document.getElementById('overlayMousePassthrough').checked;
  try { await window.electronAPI.toggleOverlayMouse(passthrough); }
  catch (e) {}
}

async function loadTranslatorScreens() {
  try {
    const screens = await window.electronAPI.translatorGetScreens();
    const sel = document.getElementById('translatorScreen');
    if (!sel) return;
    sel.innerHTML = '';
    screens.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.index;
      opt.textContent = `${s.name} (${s.width}x${s.height})`;
      sel.appendChild(opt);
    });
  } catch (e) { console.error('Load screens error:', e); }
}

async function startGameTranslator() {
  const btnStart = document.getElementById('btnStartTranslator');
  const btnStop = document.getElementById('btnStopTranslator');
  const statusEl = document.getElementById('translatorStatus');
  const progressEl = document.getElementById('translatorProgress');

  const mode = document.getElementById('translatorMode').value;
  const screenIdx = parseInt(document.getElementById('translatorScreen').value);
  const interval = parseInt(document.getElementById('translatorInterval').value);
  const from = document.getElementById('translatorFrom').value;
  const to = document.getElementById('translatorTo').value;
  const regionX = parseInt(document.getElementById('regionX').value) || 0;
  const regionY = parseInt(document.getElementById('regionY').value) || 0;
  const regionW = parseInt(document.getElementById('regionW').value) || 500;
  const regionH = parseInt(document.getElementById('regionH').value) || 200;

  const opts = {
    mode,
    screenIndex: screenIdx,
    interval,
    sourceLang: from,
    targetLang: to,
    region: { x: regionX, y: regionY, width: regionW, height: regionH }
  };

  try {
    await window.electronAPI.translatorStart(opts);
    translatorRunning = true;
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    statusEl.textContent = 'نشط';
    statusEl.style.background = 'rgba(0,255,136,0.1)';
    statusEl.style.color = '#00ff88';
    progressEl.style.display = 'block';
    document.getElementById('translatorText').textContent = 'جاري ترجمة النصوص...';
    showToast('بدأت الترجمة المباشرة', 'success');
  } catch (e) {
    showToast('خطأ في بدء الترجمة', 'error');
  }
}

async function stopGameTranslator() {
  const btnStart = document.getElementById('btnStartTranslator');
  const btnStop = document.getElementById('btnStopTranslator');
  const statusEl = document.getElementById('translatorStatus');
  const progressEl = document.getElementById('translatorProgress');

  try {
    await window.electronAPI.translatorStop();
    translatorRunning = false;
    btnStart.style.display = 'flex';
    btnStop.style.display = 'none';
    statusEl.textContent = 'متوقف';
    statusEl.style.background = 'rgba(255,51,102,0.1)';
    statusEl.style.color = '#ff3366';
    progressEl.style.display = 'none';
    showToast('تم إيقاف الترجمة', 'info');
  } catch (e) {
    showToast('خطأ في الإيقاف', 'error');
  }
}

async function translatorCaptureOnce() {
  const mode = document.getElementById('translatorMode').value;
  const screenIdx = parseInt(document.getElementById('translatorScreen').value);
  const from = document.getElementById('translatorFrom').value;
  const to = document.getElementById('translatorTo').value;
  const regionX = parseInt(document.getElementById('regionX').value) || 0;
  const regionY = parseInt(document.getElementById('regionY').value) || 0;
  const regionW = parseInt(document.getElementById('regionW').value) || 500;
  const regionH = parseInt(document.getElementById('regionH').value) || 200;

  const opts = {
    mode,
    screenIndex: screenIdx,
    sourceLang: from,
    targetLang: to,
    region: { x: regionX, y: regionY, width: regionW, height: regionH }
  };

  const statusEl = document.getElementById('translatorStatus');
  statusEl.textContent = 'جاري...';
  statusEl.style.background = 'rgba(255,149,0,0.1)';
  statusEl.style.color = '#ff9500';

  try {
    await window.electronAPI.translatorCaptureOnce(opts);
  } catch (e) {
    statusEl.textContent = 'خطأ';
    statusEl.style.background = 'rgba(255,51,102,0.1)';
    statusEl.style.color = '#ff3366';
    showToast('خطأ في التقاط الشاشة', 'error');
  }
}

async function showTranslatorOverlay() {
  try {
    await window.electronAPI.translatorShowOverlay();
    document.getElementById('btnShowOverlay').style.display = 'none';
    document.getElementById('btnHideOverlay').style.display = 'flex';
  } catch (e) {
    showToast('خطأ في إظهار النافذة', 'error');
  }
}

async function hideTranslatorOverlay() {
  try {
    await window.electronAPI.translatorHideOverlay();
    document.getElementById('btnShowOverlay').style.display = 'flex';
    document.getElementById('btnHideOverlay').style.display = 'none';
  } catch (e) {
    showToast('خطأ في إخفاء النافذة', 'error');
  }
}

if (window.electronAPI && window.electronAPI.onTranslatorResult) {
  window.electronAPI.onTranslatorResult((data) => {
    const origEl = document.getElementById('translatorOriginalText');
    const transEl = document.getElementById('translatorTranslatedText');
    const statusEl = document.getElementById('translatorStatus');
    const progressEl = document.getElementById('translatorProgress');

    if (data.error) {
      transEl.textContent = data.error;
      transEl.style.color = '#ff3366';
      statusEl.textContent = 'خطأ';
      statusEl.style.background = 'rgba(255,51,102,0.1)';
      statusEl.style.color = '#ff3366';
      return;
    }

    if (data.original && data.original.length > 0) {
      origEl.textContent = data.original;
      origEl.style.display = 'block';
    } else {
      origEl.style.display = 'none';
    }

    if (data.translated && data.translated.length > 0) {
      transEl.textContent = data.translated;
      transEl.style.color = '#00e5ff';
      statusEl.textContent = 'مترجم ✓';
      statusEl.style.background = 'rgba(0,255,136,0.1)';
      statusEl.style.color = '#00ff88';

      const historyEl = document.getElementById('translatorHistory');
      const historySection = document.getElementById('translatorHistorySection');
      if (historyEl && historySection) {
        historySection.style.display = 'block';
        const item = document.createElement('div');
        item.className = 'repair-result';
        item.innerHTML = `<span class="result-name" style="direction:ltr; text-align:left; flex:1; font-size:11px; color:#8888bb;">${data.original.substring(0, 80)}${data.original.length > 80 ? '...' : ''}</span><span class="result-status success" style="font-size:12px;">${data.translated.substring(0, 60)}</span>`;
        historyEl.insertBefore(item, historyEl.firstChild);
        if (historyEl.children.length > 20) {
          historyEl.removeChild(historyEl.lastChild);
        }
      }
    } else {
      transEl.textContent = 'لا يوجد نص للترجمة';
      transEl.style.color = '#555577';
      statusEl.textContent = 'بانتظار نص...';
      statusEl.style.background = 'rgba(255,149,0,0.1)';
      statusEl.style.color = '#ff9500';
    }

    if (translatorRunning && progressEl) {
      document.getElementById('translatorText').textContent = 'جاري الترجمة المباشرة...';
    }
  });
}

// ==================== NETWORK MANAGER ====================
async function scanNetworkDevices() {
  const btn = document.getElementById('btnScanNet');
  const list = document.getElementById('networkDevicesList');
  const info = document.getElementById('networkDeviceInfo');
  btn.disabled = true; btn.textContent = '⏳ جاري الفحص...';
  list.innerHTML = ''; info.textContent = '';
  try {
    const data = await window.electronAPI.scanNetwork();
    info.innerHTML = `IP: ${data.localIP} | Gateway: ${data.gateway} | Devices: ${data.totalDevices}`;
    const blocked = await window.electronAPI.getBlockedDevices();
    data.devices.forEach(dev => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;';
      const isBlocked = blocked.includes(dev.ip);
      card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><div style="font-weight:700; color:#e2e8f0; font-size:13px;">${dev.ip}</div><span style="font-size:11px; color:${isBlocked ? '#ef4444' : '#22c55e'}; font-weight:700;">${isBlocked ? ' محظور' : (dev.isMe ? ' ← أنت' : ' متصل')}</span></div><div style="font-size:11px; color:#64748b; margin-bottom:10px;">MAC: ${dev.mac} | ${dev.type}</div><div style="display:flex; gap:6px;">${!dev.isMe ? `<button onclick="blockNetDevice('${dev.ip}', this)" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">${isBlocked ? 'فك الحظر' : 'حظر'}</button>` : ''}</div>`;
      list.appendChild(card);
    });
  } catch (e) { info.textContent = 'خطأ في الفحص'; }
  btn.disabled = false; btn.textContent = '🔍 فحص الشبكة';
}
async function blockNetDevice(ip, btn) {
  try {
    const blocked = await window.electronAPI.getBlockedDevices();
    if (blocked.includes(ip)) {
      await window.electronAPI.unblockDevice(ip);
      showToast(`تم فك حظر ${ip}`, 'info');
    } else {
      await window.electronAPI.blockDevice(ip);
      showToast(`تم حظر ${ip}`, 'success');
    }
    scanNetworkDevices();
  } catch (e) { showToast('خطأ', 'error'); }
}

// ==================== WIFI ANALYZER ====================
async function scanWifiNetworks() {
  const btn = document.getElementById('btnWifiScan');
  const list = document.getElementById('wifiNetworksList');
  const current = document.getElementById('currentWifiInfo');
  btn.disabled = true; btn.textContent = '⏳ جاري الفحص...';
  try {
    const cw = await window.electronAPI.getCurrentWifi();
    current.innerHTML = `<div class="tweak-card" style="padding:14px; margin-bottom:12px;"><div style="font-weight:700; color:#22c55e; font-size:14px;">الاتصال الحالي: ${cw.ssid}</div><div style="font-size:12px; color:#94a3b8;">الإشارة: ${cw.signal}% | القناة: ${cw.channel} | السرعة: ${cw.speed} | الحالة: ${cw.state}</div></div>`;
    const networks = await window.electronAPI.getWifiNetworks();
    list.innerHTML = '';
    networks.forEach(n => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;';
      card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;"><div style="font-weight:700; color:#e2e8f0; font-size:14px;">${n.ssid}</div><div style="font-size:13px; color:${n.signal >= 80 ? '#22c55e' : n.signal >= 50 ? '#f59e0b' : '#ef4444'}; font-weight:700;">${n.signal}%</div></div><div style="font-size:11px; color:#64748b;">القناة: ${n.channel} | التشفير: ${n.auth} | ${n.signalBars}</div>`;
      list.appendChild(card);
    });
  } catch (e) { current.innerHTML = '<div style="color:#ef4444;">خطأ</div>'; }
  btn.disabled = false; btn.textContent = '🔍 فحص الشبكات';
}

// ==================== PING MONITOR ====================
async function startPingTest() {
  const host = document.getElementById('pingTargetInput').value.trim();
  if (!host) { showToast('ادخل سيرفر', 'error'); return; }
  const results = document.getElementById('pingResults');
  const history = document.getElementById('pingHistory');
  results.innerHTML = '<div style="color:#94a3b8;">جاري الاختبار (4 مرات)...</div>';
  try {
    const res = await window.electronAPI.pingSweep(host, 4);
    let color = '#22c55e';
    if (res.avg > 100) color = '#ef4444';
    else if (res.avg > 50) color = '#f59e0b';
    results.innerHTML = `<div class="tweak-card" style="padding:16px;"><div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px;"><div><div style="font-size:11px; color:#64748b;">MEDIUM</div><div style="font-size:24px; font-weight:700; color:${color};">${res.avg}ms</div></div><div><div style="font-size:11px; color:#64748b;">MIN</div><div style="font-size:18px; font-weight:700; color:#22c55e;">${res.min}ms</div></div><div><div style="font-size:11px; color:#64748b;">MAX</div><div style="font-size:18px; font-weight:700; color:#ef4444;">${res.max}ms</div></div><div><div style="font-size:11px; color:#64748b;">JITTER</div><div style="font-size:18px; font-weight:700; color:#f59e0b;">${res.jitter}ms</div></div><div><div style="font-size:11px; color:#64748b;">LOSS</div><div style="font-size:18px; font-weight:700; color:${res.loss > 0 ? '#ef4444' : '#22c55e'};">${res.loss}/${res.count}</div></div></div></div>`;
    const div = document.createElement('div');
    div.className = 'repair-result';
    div.innerHTML = `<span class="result-name">${host} — ${res.avg}ms (jitter: ${res.jitter}ms)</span><span class="result-status ${res.loss === 0 ? 'success' : 'failed'}">${res.loss === 0 ? 'ممتاز' : 'في فقدان'}</span>`;
    history.prepend(div);
  } catch (e) { results.innerHTML = '<div style="color:#ef4444;">خطأ في الاتصال</div>'; }
}

// ==================== PRIVACY TWEAKS ====================
async function loadPrivacyTweaks() {
  const list = document.getElementById('privacyTweaksList');
  if (!list) return;
  try {
    const tweaks = await window.electronAPI.getPrivacyTweaks();
    list.innerHTML = '';
    tweaks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;';
      card.innerHTML = `<div style="font-weight:700; color:#e2e8f0; font-size:13px; margin-bottom:6px;">${t.name}</div><div style="font-size:12px; color:#94a3b8; margin-bottom:10px;">${t.description}</div><button onclick="applyOnePrivacy('${t.id}', this)" style="background:linear-gradient(135deg,#06b6d4,#2563eb); border:none; color:#fff; padding:6px 16px; border-radius:8px; cursor:pointer; font-family:Cairo,sans-serif; font-size:11px; font-weight:700;">تطبيق</button> <span class="priv-status" style="font-size:11px; color:#64748b;"></span>`;
      list.appendChild(card);
    });
  } catch (e) { list.innerHTML = '<div style="color:#64748b;">خطأ</div>'; }
}
async function applyOnePrivacy(id, btn) {
  const statusEl = btn.parentElement.querySelector('.priv-status');
  btn.disabled = true; btn.textContent = 'جاري...';
  try {
    const res = await window.electronAPI.applyPrivacyTweak(id);
    const ok = res && res.some(r => r.status === 'success');
    statusEl.textContent = ok ? '✅ تم' : '❌ فشل';
    statusEl.style.color = ok ? '#22c55e' : '#ef4444';
  } catch (e) { statusEl.textContent = '❌'; }
  btn.disabled = false; btn.textContent = 'تطبيق';
}
async function applyAllPrivacy() {
  const results = document.getElementById('privacyResults');
  results.innerHTML = '<div style="color:#94a3b8;">جاري تطبيق الكل...</div>';
  const res = await window.electronAPI.applyAllPrivacy();
  results.innerHTML = '';
  if (res) res.forEach(item => { const d = document.createElement('div'); d.className = 'repair-result'; d.innerHTML = `<span class="result-name">${item.name}</span><span class="result-status ${item.status}">${item.status === 'success' ? 'تم' : 'فشل'}</span>`; results.appendChild(d); });
  showToast('تم تطبيق تحسينات الخصوصية', 'success');
}

// ==================== TEMPERATURE MONITOR ====================
async function refreshTemps() {
  const el = document.getElementById('tempDisplay');
  if (!el) return;
  el.innerHTML = '<div style="color:#94a3b8;">جاري قراءة الحرارة...</div>';
  try {
    const data = await window.electronAPI.getTemperatures();
    el.innerHTML = '';
    if (data.sensors && data.sensors.length > 0) {
      data.sensors.forEach(sensor => {
        const card = document.createElement('div');
        card.className = 'tweak-card';
        card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px;';
        let tempColor = '#64748b';
        if (sensor.temp > 0) tempColor = sensor.temp > 85 ? '#ef4444' : sensor.temp > 70 ? '#f59e0b' : sensor.temp > 50 ? '#f97316' : '#22c55e';
        let html = `<div style="font-size:11px; color:#64748b; margin-bottom:4px;">${sensor.category}</div>`;
        html += `<div style="font-weight:700; color:#e2e8f0; font-size:12px; margin-bottom:8px;">${sensor.name}</div>`;
        if (sensor.temp > 0) {
          html += `<div style="font-size:28px; font-weight:700; color:${tempColor};">${sensor.temp}°C</div>`;
        } else {
          html += `<div style="font-size:14px; color:#64748b;">لا توجد بيانات حرارة</div>`;
        }
        if (sensor.usage >= 0) html += `<div style="font-size:12px; color:#94a3b8; margin-top:4px;">الاستخدام: ${sensor.usage}%</div>`;
        if (sensor.cores) html += `<div style="font-size:11px; color:#64748b;">${sensor.cores} cores @ ${sensor.speed} MHz</div>`;
        if (sensor.memoryTotal) html += `<div style="font-size:11px; color:#64748b;">VRAM: ${sensor.memoryUsed}/${sensor.memoryTotal} MB</div>`;
        if (sensor.fanSpeed >= 0) html += `<div style="font-size:11px; color:#64748b;">المروحة: ${sensor.fanSpeed}%</div>`;
        if (sensor.powerDraw >= 0) html += `<div style="font-size:11px; color:#64748b;">الاستطاعة: ${sensor.powerDraw}W</div>`;
        if (sensor.rpm) html += `<div style="font-size:14px; font-weight:700; color:#06b6d4;">${sensor.rpm} RPM</div>`;
        if (sensor.health && sensor.health !== 'Unknown') {
          const hColor = sensor.health === 'Healthy' ? '#22c55e' : '#ef4444';
          html += `<div style="font-size:11px; color:${hColor};">Health: ${sensor.health}</div>`;
        }
        if (sensor.size) html += `<div style="font-size:11px; color:#64748b;">${sensor.size} GB</div>`;
        if (sensor.status !== 'info') {
          const statusIcon = sensor.status === 'critical' ? '🔴' : sensor.status === 'hot' ? '🟡' : sensor.status === 'warm' ? '🟠' : '🟢';
          html += `<div style="font-size:11px; margin-top:4px;">${statusIcon} ${sensor.status === 'critical' ? 'حرارة حرجة!' : sensor.status === 'hot' ? 'حار جداً' : sensor.status === 'warm' ? 'دافئ' : 'ممتاز'}</div>`;
        }
        card.innerHTML = html;
        el.appendChild(card);
      });
    }
    if (el.innerHTML === '') el.innerHTML = '<div style="color:#64748b; text-align:center; padding:40px;">لا توجد بيانات حرارة متاحة — تأكد من تثبيت OpenHardwareMonitor لأفضل النتائج</div>';
  } catch (e) { el.innerHTML = '<div style="color:#ef4444;">خطأ في قراءة الحرارة</div>'; }
}

// ==================== CONTEXT MENU ====================
async function loadContextMenu() {
  const list = document.getElementById('ctxMenuList');
  if (!list) return;
  try {
    const items = await window.electronAPI.getContextMenus();
    list.innerHTML = '';
    if (items.length === 0) { list.innerHTML = '<div style="color:#64748b; text-align:center;">لا توجد عناصر مخصصة</div>'; return; }
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;';
      card.innerHTML = `<div style="font-weight:700; color:#e2e8f0; font-size:13px;">${item.name}</div><div style="font-size:11px; color:#64748b; margin:6px 0;">${item.command || 'No command'}</div><button onclick="removeCtxMenu('${item.path.replace(/\\/g, '\\\\')}', this)" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:700;">🗑️ حذف</button>`;
      list.appendChild(card);
    });
  } catch (e) { list.innerHTML = '<div style="color:#64748b;">خطأ</div>'; }
}
async function addCtxMenuItem() {
  const name = document.getElementById('ctxMenuName').value.trim();
  const cmd = document.getElementById('ctxMenuCmd').value.trim();
  if (!name || !cmd) { showToast('أدخل الاسم والأمر', 'error'); return; }
  await window.electronAPI.addContextMenu(name, cmd);
  document.getElementById('ctxMenuName').value = '';
  document.getElementById('ctxMenuCmd').value = '';
  showToast('تمت الإضافة', 'success');
  loadContextMenu();
}
async function removeCtxMenu(path, btn) {
  await window.electronAPI.removeContextMenu(path);
  showToast('تم الحذف', 'info');
  loadContextMenu();
}

// ==================== BROWSER CLEANUP ====================
async function loadBrowserSizes() {
  const list = document.getElementById('browserSizesList');
  if (!list) return;
  try {
    const browsers = await window.electronAPI.getBrowserSizes();
    list.innerHTML = '';
    browsers.forEach(b => {
      const card = document.createElement('div');
      card.className = 'tweak-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px;';
      card.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><div style="font-weight:700; color:#e2e8f0; font-size:13px;">${b.name}</div><span style="font-size:12px; color:${b.sizeMB > 100 ? '#ef4444' : '#f59e0b'}; font-weight:700;">${b.sizeMB} MB</span></div><button onclick="cleanOneBrowser('${b.id}', this)" style="background:linear-gradient(135deg,#06b6d4,#2563eb); border:none; color:#fff; padding:6px 16px; border-radius:8px; cursor:pointer; font-family:Cairo,sans-serif; font-size:11px; font-weight:700;">🧹 تنظيف</button> <span class="br-status" style="font-size:11px; color:#64748b;"></span>`;
      list.appendChild(card);
    });
  } catch (e) { list.innerHTML = '<div style="color:#64748b;">خطأ</div>'; }
}
async function cleanOneBrowser(id, btn) {
  const statusEl = btn.parentElement.querySelector('.br-status');
  btn.disabled = true; btn.textContent = 'جاري...';
  try {
    const res = await window.electronAPI.cleanBrowser(id);
    statusEl.textContent = res.success ? '✅ تم' : '❌';
    statusEl.style.color = res.success ? '#22c55e' : '#ef4444';
    loadBrowserSizes();
  } catch (e) { statusEl.textContent = '❌'; }
  btn.disabled = false; btn.textContent = '🧹 تنظيف';
}
async function cleanAllBrowsers() {
  showToast('جاري تنظيف المتصفحات...', 'info');
  const res = await window.electronAPI.cleanAllBrowsers();
  showToast('تم تنظيف المتصفحات', 'success');
  loadBrowserSizes();
}

const dcBtn = document.getElementById('discordBtn');
if (dcBtn) dcBtn.addEventListener('click', () => {
  window.electronAPI.openExternal('https://discord.com/users/0');
});

window.loadSsdTweaks = loadSsdTweaks;
window.applyAllSsdTweaks = applyAllSsdTweaks;
window.revertAllSsdTweaks = revertAllSsdTweaks;
window.loadVisualTweaks = loadVisualTweaks;
window.applyAllVisualTweaks = applyAllVisualTweaks;
window.revertAllVisualTweaks = revertAllVisualTweaks;
window.loadInputLagTweaks = loadInputLagTweaks;
window.applyAllInputLagFixes = applyAllInputLagFixes;
window.revertAllInputLagFixes = revertAllInputLagFixes;
window.loadNetTurboTweaks = loadNetTurboTweaks;
window.applyAllNetTurbo = applyAllNetTurbo;
window.revertAllNetTurbo = revertAllNetTurbo;
window.loadWinUpdateStatus = loadWinUpdateStatus;
window.blockWinUpdates = blockWinUpdates;
window.unblockWinUpdates = unblockWinUpdates;
window.switchUninstallTab = switchUninstallTab;
window.loadStoreApps = loadStoreApps;
window.toggleStoreApp = toggleStoreApp;
window.removeSelectedStoreApps = removeSelectedStoreApps;
window.startAutoRamClean = startAutoRamClean;
window.stopAutoRamClean = stopAutoRamClean;
window.loadProfilesList = loadProfilesList;
window.saveCurrentAsProfile = saveCurrentAsProfile;
window.applyProfileById = applyProfileById;
window.deleteProfileById = deleteProfileById;
window.resetProfilesToDefault = resetProfilesToDefault;
window.startFpsOverlay = startFpsOverlay;
window.stopFpsOverlay = stopFpsOverlay;
window.toggleOverlayMouseMode = toggleOverlayMouseMode;

// Update notifications
window.electronAPI.onUpdateAvailable((version) => {
  showToast(`تحديث جديد متاح: v${version} — جاري التحميل...`, 'info');
});
window.electronAPI.onUpdateDownloaded((version) => {
  if (confirm(`تم تحميل التحديث v${version}\nهل تريد إعادة التشغيل وتثبيته الآن؟`)) {
    window.electronAPI.installUpdate();
  }
});

loadDashboard();

setTimeout(() => {
  initDiscordRpc();
  setInterval(updateRpcBadge, 10000);
}, 2000);
