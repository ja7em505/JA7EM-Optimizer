const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] Unhandled Rejection:', reason);
});
const fpsBoost = require('./services/fps-boost');
const driverUpdate = require('./services/driver-update');
const systemClean = require('./services/system-clean');
const systemMonitor = require('./services/system-monitor');
const gameTranslate = require('./services/game-translate');
const gameSettings = require('./services/game-settings');
const changeTracker = require('./services/change-tracker');
const stutterFix = require('./services/stutter-fix');
const windowsRepair = require('./services/windows-repair');
const internetRepair = require('./services/internet-repair');
const startupManager = require('./services/startup-manager');
const gameMode = require('./services/game-mode');
const ramOptimizer = require('./services/ram-optimizer');
const diskHealth = require('./services/disk-health');
const powerPlans = require('./services/power-plans');
const speedTest = require('./services/speed-test');
const restorePoints = require('./services/restore-points');
const fullOptimizer = require('./services/full-optimizer');
const processManager = require('./services/process-manager');
const defenderManager = require('./services/defender-manager');
const bsodAnalyzer = require('./services/bsod-analyzer');
const duplicateFinder = require('./services/duplicate-finder');
const networkMonitor = require('./services/network-monitor');
const serviceManager = require('./services/service-manager');
const cpuBenchmark = require('./services/cpu-benchmark');
const systemInfoService = require('./services/system-info');
const uninstaller = require('./services/uninstaller');
const diskAnalyzer = require('./services/disk-analyzer');
const networkOptimizer = require('./services/network-optimizer');
const networkManager = require('./services/network-manager');
const gpuOptimizer = require('./services/gpu-optimizer');
const mouseLatency = require('./services/mouse-latency');
const privacyTweaks = require('./services/privacy-tweaks');
const tempMonitor = require('./services/temp-monitor');
const wifiAnalyzer = require('./services/wifi-analyzer');
const pingMonitor = require('./services/ping-monitor');
const contextMenu = require('./services/context-menu');
const browserCleanup = require('./services/browser-cleanup');
const bloatwareRemover = require('./services/bloatware-remover');
const ssdOptimizer = require('./services/ssd-optimizer');
const visualEffects = require('./services/visual-effects');
const inputLagFixer = require('./services/input-lag-fixer');
const networkTurbo = require('./services/network-turboboost');
const winUpdateBlocker = require('./services/windows-update-blocker');
const windowsAppsUninstaller = require('./services/windows-apps-uninstaller');
const autoMemoryCleaner = require('./services/auto-memory-cleaner');
const gameFpsProfiles = require('./services/game-fps-profiles');
const fpsOverlay = require('./services/fps-overlay');
const discordRPC = require('./services/discord-rpc');
const licenseManager = require('./license-manager');
const protection = require('./protection');

const JA7EM_OPTIMIZER_v1 = 'JA7EM_AUTHENTIC';
const BY_JA7EM_ONLY = 'LICENSED_SOFTWARE';
const DO_NOT_MODIFY = 'INTEGRITY_CHECK';

let mainWindow;
let isLicensed = false;

function requireLicense(handler) {
  return async (event, ...args) => {
    if (protection.isLocked()) {
      return { error: 'device_locked', message: 'This device is locked' };
    }
    if (!licenseManager.isLicenseActive()) {
      return { error: 'license_required', message: 'This feature requires an active license' };
    }
    return handler(event, ...args);
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0a0a0a'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[APP] Page loaded');
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
  });
}

app.whenReady().then(async () => {
  if (protection.isLocked()) {
    const lockReason = protection.getLockReason();
    let canBoot = false;
    if (lockReason === 'device_banned') {
      const forgive = await licenseManager.tryForgiveBan();
      if (forgive.forgiven) {
        protection.clearLock();
        licenseManager.clearLocalBan();
        console.log('[SECURITY] Ban forgiven online. Unlocked.');
        canBoot = true;
      } else {
        console.log('[SECURITY] Device is banned. Exiting.');
      }
    } else if (lockReason === 'license_revoked') {
      protection.clearLock();
      console.log('[SECURITY] License lock cleared. Activation required.');
      canBoot = true;
    } else {
      console.log('[SECURITY] Device is locked. Exiting.');
    }
    if (!canBoot) {
      app.exit(1);
      return;
    }
  }
  createWindow();
  isLicensed = licenseManager.isLicenseActive();
  const securityResults = protection.initialize(mainWindow);
  console.log('[SECURITY] Startup check:', JSON.stringify(securityResults));
  if (securityResults.locked) {
    setTimeout(() => app.exit(1), 1500);
    return;
  }
  protection.onViolation((reason) => {
    console.log('[SECURITY] Violation:', reason);
    setTimeout(() => { try { app.quit(); } catch (e) { app.exit(1); } }, 1800);
  });
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info.version);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info.version);
  }
});

autoUpdater.on('error', () => {});

app.on('window-all-closed', () => app.quit());

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-system-info', async () => await systemMonitor.getSystemInfo());
ipcMain.handle('get-live-stats', async () => await systemMonitor.getLiveStats());
ipcMain.handle('apply-fps-boost', requireLicense(async (event, options) => await fpsBoost.applyBoost(options)));
ipcMain.handle('revert-fps-boost', requireLicense(async () => await fpsBoost.revertAll()));
ipcMain.handle('clean-system', requireLicense(async () => await systemClean.cleanAll()));
ipcMain.handle('get-drivers', async () => await driverUpdate.getDrivers());
ipcMain.handle('update-driver', requireLicense(async (event, deviceId) => await driverUpdate.updateDriver(deviceId)));
ipcMain.handle('toggle-service', requireLicense(async (event, serviceName, enable) => await systemClean.toggleService(serviceName, enable)));
ipcMain.handle('translate-text', async (event, text, from, to) => await gameTranslate.translateText(text, from, to));
ipcMain.handle('translate-game-texts', async (event, texts, from, to) => await gameTranslate.translateGameText(texts, from, to));
ipcMain.handle('scan-games', async () => await gameSettings.scanGames());
ipcMain.handle('scan-games-for-disk', async () => await gameSettings.scanGamesForDisk());
ipcMain.handle('apply-game-preset', requireLicense(async (event, gamePath, presetName, configs) => await gameSettings.applyGamePreset(gamePath, presetName, configs)));
ipcMain.handle('revert-game-configs', requireLicense(async (event, gamePath) => await gameSettings.revertGameConfigs(gamePath)));
ipcMain.handle('get-game-presets', async () => await gameSettings.getPresets());
ipcMain.handle('reset-all-game-settings', requireLicense(async () => await gameSettings.resetAllGameSettings()));
ipcMain.handle('get-change-log', async () => await changeTracker.getChangeLog());
ipcMain.handle('clear-change-log', async () => { changeTracker.clearLog(); return { status: 'success' }; });
ipcMain.handle('get-stutter-fixes', async () => await stutterFix.getFixDetails());
ipcMain.handle('apply-stutter-fix', requireLicense(async (event, options) => await stutterFix.applyStutterFix(options)));
ipcMain.handle('revert-stutter-fix', requireLicense(async () => await stutterFix.revertStutterFix()));
ipcMain.handle('select-game-folder', async () => { const result = await dialog.showOpenDialog(mainWindow, { title: 'اختر مجلد اللعبة', properties: ['openDirectory'] }); if (result.canceled || result.filePaths.length === 0) return null; const gamePath = result.filePaths[0]; try { const items = fs.readdirSync(gamePath); const configsFound = []; const configFileNames = ['GameUserSettings.ini', 'Engine.ini', 'Settings.ini', 'Game.ini', 'settings.json', 'config.json', 'options.json', 'video.cfg', 'options.cfg', 'config.cfg', 'settings.cfg', 'settings.xml']; function searchConfigs(dir, depth) { if (depth > 4) return; try { const files = fs.readdirSync(dir); for (const file of files) { const filePath = path.join(dir, file); try { const stat = fs.statSync(filePath); if (stat.isDirectory()) searchConfigs(filePath, depth + 1); else { const name = file.toLowerCase(); if (configFileNames.some(cf => name === cf.toLowerCase())) { let type = 'ini'; if (name.endsWith('.json')) type = 'json'; else if (name.endsWith('.cfg')) type = 'cfg'; else if (name.endsWith('.xml')) type = 'xml'; configsFound.push({ path: filePath, type, name: file }); } } } catch (e) {} } } catch (e) {} } searchConfigs(gamePath, 0); return { name: gamePath, path: gamePath, configs: configsFound }; } catch (e) { return null; } });

ipcMain.handle('repair-sfc', requireLicense(async () => { try { await new Promise((resolve, reject) => { require('child_process').exec('sfc /scannow', { timeout: 600000 }, (err) => err ? reject(err) : resolve()); }); return { status: 'success', message: 'SFC completed' }; } catch (e) { return { status: 'failed', message: e.message }; } }));
ipcMain.handle('repair-dism', requireLicense(async () => { try { await new Promise((resolve, reject) => { require('child_process').exec('DISM /Online /Cleanup-Image /ScanHealth', { timeout: 600000 }, (err) => err ? reject(err) : resolve()); }); return { status: 'success', message: 'DISM completed' }; } catch (e) { return { status: 'failed', message: e.message }; } }));
ipcMain.handle('repair-windows', requireLicense(async () => await windowsRepair.repairWindows()));
ipcMain.handle('repair-windows-update', requireLicense(async () => await windowsRepair.repairWindowsUpdate()));
ipcMain.handle('repair-registry', requireLicense(async () => await windowsRepair.repairRegistry()));
ipcMain.handle('repair-dll', requireLicense(async () => await windowsRepair.repairDLL()));
ipcMain.handle('full-windows-repair', requireLicense(async () => await windowsRepair.fullWindowsRepair()));
ipcMain.handle('reset-tcp', requireLicense(async () => await internetRepair.resetTCP()));
ipcMain.handle('reset-winsock', requireLicense(async () => await internetRepair.resetWinsock()));
ipcMain.handle('flush-dns', requireLicense(async () => await internetRepair.flushDNS()));
ipcMain.handle('optimize-dns', requireLicense(async () => await internetRepair.optimizeDNS()));
ipcMain.handle('fix-network-adapters', requireLicense(async () => await internetRepair.fixNetworkAdapters()));
ipcMain.handle('reset-firewall', requireLicense(async () => await internetRepair.resetFirewall()));
ipcMain.handle('fix-slow-internet', requireLicense(async () => await internetRepair.fixSlowInternet()));
ipcMain.handle('full-internet-repair', requireLicense(async () => await internetRepair.fullInternetRepair()));
ipcMain.handle('get-network-tweaks', async () => networkOptimizer.networkTweaks);
ipcMain.handle('get-network-status', async () => await networkOptimizer.getNetworkStatus());
ipcMain.handle('optimize-network-dns', async () => await networkOptimizer.optimizeDNS());
ipcMain.handle('disable-nagle', async () => await networkOptimizer.disableNagle());
ipcMain.handle('disable-throttling', async () => await networkOptimizer.disableThrottling());
ipcMain.handle('optimize-qos', async () => await networkOptimizer.optimizeQoS());
ipcMain.handle('optimize-tcp-autotune', async () => await networkOptimizer.optimizeTCPAutoTuning());
ipcMain.handle('disable-interrupt-moderation', async () => await networkOptimizer.disableInterruptModeration());
ipcMain.handle('optimize-game-priority', async () => await networkOptimizer.optimizeGamePriority());
ipcMain.handle('apply-all-network-optimizations', async () => await networkOptimizer.applyAllOptimizations());
ipcMain.handle('revert-network-optimizations', async () => await networkOptimizer.revertAllOptimizations());

ipcMain.handle('scan-network', async () => await networkManager.scanNetwork());
ipcMain.handle('get-device-details', async (event, ip) => await networkManager.getDeviceDetails(ip));
ipcMain.handle('block-device', async (event, ip) => await networkManager.blockDevice(ip));
ipcMain.handle('unblock-device', async (event, ip) => await networkManager.unblockDevice(ip));
ipcMain.handle('limit-bandwidth', async (event, ip, speed) => await networkManager.limitBandwidth(ip, speed));
ipcMain.handle('get-blocked-devices', async () => await networkManager.getBlockedDevices());

ipcMain.handle('get-gpu-info', async () => await gpuOptimizer.getGPUInfo());
ipcMain.handle('optimize-gpu', requireLicense(async () => await gpuOptimizer.optimizeGPU()));
ipcMain.handle('revert-gpu', requireLicense(async () => await gpuOptimizer.revertGPU()));

ipcMain.handle('get-mouse-settings', async () => await mouseLatency.getMouseSettings());
ipcMain.handle('optimize-mouse', requireLicense(async () => await mouseLatency.optimizeMouse()));
ipcMain.handle('revert-mouse', requireLicense(async () => await mouseLatency.revertMouse()));

ipcMain.handle('get-privacy-tweaks', async () => privacyTweaks.privacyTweaks);
ipcMain.handle('apply-privacy-tweak', requireLicense(async (event, id) => await privacyTweaks.applyPrivacyTweak(id)));
ipcMain.handle('apply-all-privacy', requireLicense(async () => await privacyTweaks.applyAllPrivacy()));

ipcMain.handle('get-temperatures', async () => await tempMonitor.getAllTemperatures());
ipcMain.handle('get-cpu-temp', async () => await tempMonitor.getCPUInfo());

ipcMain.handle('get-wifi-networks', async () => await wifiAnalyzer.getWifiNetworks());
ipcMain.handle('get-current-wifi', async () => await wifiAnalyzer.getCurrentWifi());

ipcMain.handle('ping-once', async (event, host) => await pingMonitor.pingOnce(host));
ipcMain.handle('ping-sweep', async (event, host, count) => await pingMonitor.pingSweep(host, count));
ipcMain.handle('get-ping-presets', async () => pingMonitor.presetTargets);

ipcMain.handle('get-context-menus', async () => await contextMenu.getContextMenus());
ipcMain.handle('remove-context-menu', async (event, path) => await contextMenu.removeContextMenu(path));
ipcMain.handle('add-context-menu', async (event, name, cmd) => await contextMenu.addContextMenu(name, cmd));

ipcMain.handle('get-browser-sizes', async () => await browserCleanup.getBrowserSizes());
ipcMain.handle('clean-browser', requireLicense(async (event, id) => await browserCleanup.cleanBrowser(id)));
ipcMain.handle('clean-all-browsers', requireLicense(async () => await browserCleanup.cleanAllBrowsers()));
ipcMain.handle('get-startup-items', async () => await startupManager.getStartupItems());
ipcMain.handle('toggle-startup-item', requireLicense(async (event, registryKey, name, enable) => await startupManager.toggleStartupItem(registryKey, name, enable)));
ipcMain.handle('remove-startup-item', requireLicense(async (event, registryKey, name) => await startupManager.removeStartupItem(registryKey, name)));
ipcMain.handle('activate-game-mode', requireLicense(async (event, selectedProcs) => await gameMode.activateGameMode(selectedProcs)));
ipcMain.handle('deactivate-game-mode', requireLicense(async () => await gameMode.deactivateGameMode()));
ipcMain.handle('get-game-mode-status', async () => gameMode.getGameModeStatus());
ipcMain.handle('get-running-processes', async () => await gameMode.getRunningProcesses());

ipcMain.handle('get-ram-info', async () => await ramOptimizer.getRamInfo());
ipcMain.handle('clean-ram', requireLicense(async () => await ramOptimizer.cleanRam()));
ipcMain.handle('get-disk-health', async () => await diskHealth.getDiskHealth());
ipcMain.handle('check-disk-errors', async (event, drive) => await diskHealth.checkDiskErrors(drive));
ipcMain.handle('get-disk-usage', async () => await diskHealth.getDiskUsage());
ipcMain.handle('get-smart-data', async (event, drive) => await diskHealth.getSMART(drive));
ipcMain.handle('get-power-plans', async () => await powerPlans.getPowerPlans());
ipcMain.handle('set-active-plan', requireLicense(async (event, guid) => await powerPlans.setActivePlan(guid)));
ipcMain.handle('create-gaming-plan', requireLicense(async () => await powerPlans.createGamingPlan()));
ipcMain.handle('create-power-saver-plan', requireLicense(async () => await powerPlans.createPowerSaverPlan()));
ipcMain.handle('run-speed-test', requireLicense(async () => await speedTest.runSpeedTest()));
ipcMain.handle('get-restore-points', async () => await restorePoints.getRestorePoints());
ipcMain.handle('create-restore-point', requireLicense(async (event, desc) => await restorePoints.createRestorePoint(desc)));
ipcMain.handle('restore-to-point', requireLicense(async (event, id) => await restorePoints.restoreToPoint(id)));
ipcMain.handle('get-restore-status', async () => await restorePoints.getRestoreStatus());
ipcMain.handle('enable-restore', requireLicense(async (event, drive) => await restorePoints.enableRestore(drive)));
ipcMain.handle('run-full-optimization', requireLicense(async () => await fullOptimizer.runFullOptimization()));

ipcMain.handle('get-processes', async (event, sortBy) => await processManager.getProcesses(sortBy));
ipcMain.handle('kill-process', async (event, pid) => await processManager.killProcess(pid));
ipcMain.handle('kill-process-by-name', async (event, name) => await processManager.killProcessByName(name));
ipcMain.handle('get-process-details', async (event, pid) => await processManager.getProcessDetails(pid));
ipcMain.handle('set-process-priority', async (event, pid, priority) => await processManager.setProcessPriority(pid, priority));
ipcMain.handle('get-process-stats', async () => await processManager.getProcessStats());

ipcMain.handle('get-defender-status', async () => await defenderManager.getDefenderStatus());
ipcMain.handle('toggle-defender-realtime', requireLicense(async (event, enable) => await defenderManager.toggleRealtime(enable)));
ipcMain.handle('toggle-defender-behavior', requireLicense(async (event, enable) => await defenderManager.toggleBehavior(enable)));
ipcMain.handle('start-defender-scan', requireLicense(async (event, type) => await defenderManager.startScan(type)));
ipcMain.handle('add-defender-exclusion', requireLicense(async (event, path) => await defenderManager.addExclusion(path)));
ipcMain.handle('remove-defender-exclusion', requireLicense(async (event, path) => await defenderManager.removeExclusion(path)));
ipcMain.handle('update-defender-definitions', requireLicense(async () => await defenderManager.updateDefinitions()));
ipcMain.handle('get-bsod-reports', async () => await bsodAnalyzer.getBSODReports());
ipcMain.handle('analyze-minidump', async (event, fileName) => await bsodAnalyzer.analyzeMinidump(fileName));
ipcMain.handle('find-duplicates', async () => await duplicateFinder.findDuplicates());
ipcMain.handle('delete-duplicate-files', async (event, filesToKeep, filesToDelete) => await duplicateFinder.deleteDuplicateFiles(filesToKeep, filesToDelete));
ipcMain.handle('get-active-connections', async () => await networkMonitor.getActiveConnections());
ipcMain.handle('get-network-stats', async () => await networkMonitor.getNetworkStats());
ipcMain.handle('get-wifi-profiles', async () => await networkMonitor.getWifiProfiles());
ipcMain.handle('get-wifi-password', async (event, profileName) => await networkMonitor.getWifiPassword(profileName));
ipcMain.handle('get-services', async () => await serviceManager.getServices());
ipcMain.handle('start-service', requireLicense(async (event, name) => await serviceManager.startService(name)));
ipcMain.handle('stop-service', requireLicense(async (event, name) => await serviceManager.stopService(name)));
ipcMain.handle('restart-service', requireLicense(async (event, name) => await serviceManager.restartService(name)));
ipcMain.handle('set-service-startup', requireLicense(async (event, name, startType) => await serviceManager.setServiceStartup(name, startType)));
ipcMain.handle('get-cpu-info', async () => await cpuBenchmark.getCpuInfo());
ipcMain.handle('run-cpu-benchmark', async () => await cpuBenchmark.runBenchmark());
ipcMain.handle('get-full-system-info', async () => await systemInfoService.getSystemInfo());
ipcMain.handle('get-installed-apps', async () => await uninstaller.getInstalledApps());
ipcMain.handle('uninstall-app', requireLicense(async (event, name, uninstallString) => await uninstaller.uninstallApp(name, uninstallString)));
ipcMain.handle('get-drive-overview', async () => await diskAnalyzer.getDriveOverview());
ipcMain.handle('analyze-directory', async (event, dirPath) => await diskAnalyzer.analyzeDirectory(dirPath));
ipcMain.handle('get-directory-tree', async (event, dirPath, depth, maxSize) => await diskAnalyzer.getDirectoryTree(dirPath, depth, maxSize));
ipcMain.handle('get-top-files', async (event, dirPath, limit) => await diskAnalyzer.getTopFiles(dirPath, limit));
ipcMain.handle('delete-disk-item', async (event, itemPath) => await diskAnalyzer.deleteItem(itemPath));
ipcMain.handle('open-external', async (event, url) => await shell.openExternal(url));
ipcMain.handle('check-for-updates', async () => { try { const result = await autoUpdater.checkForUpdates(); return result ? { version: result.updateInfo.version } : null; } catch (e) { return null; } });
ipcMain.handle('install-update', () => { autoUpdater.quitAndInstall(); });

ipcMain.handle('validate-license', async (event, key) => {
  const result = await licenseManager.validateLicense(key);
  if (result.valid) {
    isLicensed = true;
    licenseManager.saveLicense(key, result);
    protection.logModification('license_valid', `Key validated: ${key.substring(0, 10)}...`);
  } else {
    licenseManager.logCrackAttempt(key, result.reason, licenseManager.getDeviceInfo());
    protection.logModification('license_invalid', `Reason: ${result.reason}, Key: ${key.substring(0, 10)}...`);
    if (result.reason === 'device_banned') {
      licenseManager.clearSavedLicense();
      protection.hardLock('device_banned');
      mainWindow.webContents.send('security-alert', 'banned');
    }
  }
  return result;
});

ipcMain.handle('check-license-status', async () => {
  return licenseManager.getLicenseStatus();
});

ipcMain.handle('get-license-status', async () => {
  return licenseManager.getLicenseStatus();
});

ipcMain.handle('discord-rpc-start', async () => await discordRPC.start());
ipcMain.handle('discord-rpc-stop', async () => await discordRPC.stop());
ipcMain.handle('discord-rpc-status', async () => discordRPC.getStatus());
ipcMain.handle('discord-rpc-toggle', async (event, val) => discordRPC.setEnabled(val));

ipcMain.handle('get-installed-bloatware', async () => await bloatwareRemover.getInstalledBloatware());
ipcMain.handle('uninstall-bloatware', requireLicense(async (event, pkgName) => await bloatwareRemover.uninstallBloatware(pkgName)));
ipcMain.handle('uninstall-all-bloatware', requireLicense(async () => await bloatwareRemover.uninstallAllBloatware()));
ipcMain.handle('get-bloatware-categories', async () => await bloatwareRemover.getBloatwareCategories());

ipcMain.handle('get-ssd-tweaks', async () => await ssdOptimizer.getSsdTweaks());
ipcMain.handle('apply-ssd-tweak', async (event, id) => await ssdOptimizer.applySsdTweak(id));
ipcMain.handle('apply-all-ssd-tweaks', async () => await ssdOptimizer.applyAllSsdTweaks());
ipcMain.handle('revert-all-ssd-tweaks', async () => await ssdOptimizer.revertAllSsdTweaks());

ipcMain.handle('get-visual-tweaks', async () => await visualEffects.getVisualTweaks());
ipcMain.handle('apply-visual-tweak', async (event, id) => await visualEffects.applyVisualTweak(id));
ipcMain.handle('apply-all-visual-tweaks', async () => await visualEffects.applyAllVisualTweaks());
ipcMain.handle('revert-all-visual-tweaks', async () => await visualEffects.revertAllVisualTweaks());

ipcMain.handle('get-input-lag-tweaks', async () => await inputLagFixer.getInputLagTweaks());
ipcMain.handle('apply-input-lag-tweak', async (event, id) => await inputLagFixer.applyInputLagTweak(id));
ipcMain.handle('apply-all-input-lag-fixes', async () => await inputLagFixer.applyAllInputLagFixes());
ipcMain.handle('revert-all-input-lag-fixes', async () => await inputLagFixer.revertAllInputLagFixes());

ipcMain.handle('get-net-turboboost-tweaks', async () => await networkTurbo.getAllTweaks());
ipcMain.handle('apply-net-turboboost-tweak', async (event, id) => await networkTurbo.applyTweak(id));
ipcMain.handle('apply-all-net-turboboost', async () => await networkTurbo.applyAll());
ipcMain.handle('revert-all-net-turboboost', async () => await networkTurbo.revertAll());

ipcMain.handle('block-windows-update', async () => await winUpdateBlocker.blockWindowsUpdate());
ipcMain.handle('unblock-windows-update', async () => await winUpdateBlocker.unblockWindowsUpdate());
ipcMain.handle('get-windows-update-status', async () => await winUpdateBlocker.getStatus());

ipcMain.handle('get-all-store-apps', async () => await windowsAppsUninstaller.getAllStoreApps());
ipcMain.handle('get-all-provisioned-apps', async () => await windowsAppsUninstaller.getAllProvisionedApps());
ipcMain.handle('remove-store-app', requireLicense(async (event, fullName) => await windowsAppsUninstaller.removeStoreApp(fullName)));
ipcMain.handle('remove-provisioned-app', requireLicense(async (event, pkgName) => await windowsAppsUninstaller.removeProvisionedApp(pkgName)));
ipcMain.handle('remove-multiple-store-apps', requireLicense(async (event, apps) => await windowsAppsUninstaller.removeMultipleStoreApps(apps)));

ipcMain.handle('get-memory-status', async () => await autoMemoryCleaner.getMemoryStatus());
ipcMain.handle('clean-memory-once', async () => await autoMemoryCleaner.cleanOnce());
ipcMain.handle('start-auto-clean', async (event, ms) => await autoMemoryCleaner.startAutoClean(ms, BrowserWindow.fromWebContents(event.sender)));
ipcMain.handle('stop-auto-clean', async () => { autoMemoryCleaner.stopAutoClean(); return { status: 'stopped' }; });
ipcMain.handle('is-auto-clean-running', async () => autoMemoryCleaner.isAutoCleanRunning());

ipcMain.handle('get-game-fps-profiles', async () => await gameFpsProfiles.getAllProfiles());
ipcMain.handle('save-game-fps-profile', async (event, name, settings) => await gameFpsProfiles.saveProfile(name, settings));
ipcMain.handle('update-game-fps-profile', async (event, id, name, settings) => await gameFpsProfiles.updateProfile(id, name, settings));
ipcMain.handle('delete-game-fps-profile', async (event, id) => await gameFpsProfiles.deleteProfile(id));
ipcMain.handle('reset-game-fps-profiles', async () => await gameFpsProfiles.resetToDefault());

ipcMain.handle('start-fps-overlay', async (event) => await fpsOverlay.startOverlay(BrowserWindow.fromWebContents(event.sender)));
ipcMain.handle('stop-fps-overlay', async () => { fpsOverlay.stopOverlay(); return { status: 'stopped' }; });
ipcMain.handle('is-fps-overlay-running', async () => fpsOverlay.isOverlayRunning());
ipcMain.handle('toggle-overlay-mouse', async (event, passthrough) => { fpsOverlay.toggleMousePassthrough(passthrough); });

ipcMain.handle('deactivate-license', async () => {
  try {
    const configDir = path.join(process.env.APPDATA || process.env.HOME, 'JA7EM-Optimizer');
    const licenseFile = path.join(configDir, 'license.dat');
    if (fs.existsSync(licenseFile)) fs.unlinkSync(licenseFile);
    isLicensed = false;
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-security-status', async () => {
  return {
    integrity: protection.isIntegrityPassed(),
    debugger: protection.isDebuggerDetected(),
    licensed: protection.isLicenseValid() || isLicensed
  };
});

ipcMain.handle('get-crack-attempts', async () => {
  return licenseManager.getAttempts();
});

ipcMain.handle('get-modification-logs', async () => {
  return protection.getModificationLogs();
});

const gameTranslator = require('./services/game-translator');

ipcMain.handle('translator-get-screens', async () => {
  return await gameTranslator.getAvailableScreens();
});

ipcMain.handle('translator-start', async (e, opts) => {
  return gameTranslator.startTranslation(opts);
});

ipcMain.handle('translator-stop', async () => {
  return gameTranslator.stopTranslation();
});

ipcMain.handle('translator-update-settings', async (e, opts) => {
  return gameTranslator.updateSettings(opts);
});

ipcMain.handle('translator-get-settings', async () => {
  return gameTranslator.getSettings();
});

ipcMain.handle('translator-show-overlay', async () => {
  gameTranslator.createOverlayWindow();
  return { status: 'shown' };
});

ipcMain.handle('translator-hide-overlay', async () => {
  gameTranslator.closeOverlayWindow();
  return { status: 'hidden' };
});

ipcMain.handle('translator-capture-once', async (e, opts) => {
  if (opts) gameTranslator.updateSettings(opts);
  await gameTranslator.processCapture();
  return { status: 'captured' };
});

ipcMain.handle('translator-get-history', async () => {
  return gameTranslator.getHistory();
});
