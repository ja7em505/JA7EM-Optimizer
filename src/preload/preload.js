const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getLiveStats: () => ipcRenderer.invoke('get-live-stats'),

  applyFpsBoost: (options) => ipcRenderer.invoke('apply-fps-boost', options),
  revertFpsBoost: () => ipcRenderer.invoke('revert-fps-boost'),

  createRestorePoint: () => ipcRenderer.invoke('create-restore-point'),
  cleanSystem: () => ipcRenderer.invoke('clean-system'),

  getDrivers: () => ipcRenderer.invoke('get-drivers'),
  updateDriver: (deviceId) => ipcRenderer.invoke('update-driver', deviceId),

  toggleService: (serviceName, enable) => ipcRenderer.invoke('toggle-service', serviceName, enable),

  translateText: (text, from, to) => ipcRenderer.invoke('translate-text', text, from, to),
  translateGameTexts: (texts, from, to) => ipcRenderer.invoke('translate-game-texts', texts, from, to),

  scanGames: () => ipcRenderer.invoke('scan-games'),
  scanGamesForDisk: () => ipcRenderer.invoke('scan-games-for-disk'),
  selectGameFolder: () => ipcRenderer.invoke('select-game-folder'),
  applyGamePreset: (gamePath, presetName, configs) => ipcRenderer.invoke('apply-game-preset', gamePath, presetName, configs),
  revertGameConfigs: (gamePath) => ipcRenderer.invoke('revert-game-configs', gamePath),
  getGamePresets: () => ipcRenderer.invoke('get-game-presets'),
  resetAllGameSettings: () => ipcRenderer.invoke('reset-all-game-settings'),
  getChangeLog: () => ipcRenderer.invoke('get-change-log'),
  clearChangeLog: () => ipcRenderer.invoke('clear-change-log'),

  getStutterFixes: () => ipcRenderer.invoke('get-stutter-fixes'),
  applyStutterFix: (options) => ipcRenderer.invoke('apply-stutter-fix', options),
  revertStutterFix: () => ipcRenderer.invoke('revert-stutter-fix'),

  repairSFC: () => ipcRenderer.invoke('repair-sfc'),
  repairDISM: () => ipcRenderer.invoke('repair-dism'),
  repairWindows: () => ipcRenderer.invoke('repair-windows'),
  repairWindowsUpdate: () => ipcRenderer.invoke('repair-windows-update'),
  repairRegistry: () => ipcRenderer.invoke('repair-registry'),
  repairDLL: () => ipcRenderer.invoke('repair-dll'),
  fullWindowsRepair: () => ipcRenderer.invoke('full-windows-repair'),

  resetTCP: () => ipcRenderer.invoke('reset-tcp'),
  resetWinsock: () => ipcRenderer.invoke('reset-winsock'),
  flushDNS: () => ipcRenderer.invoke('flush-dns'),
  optimizeDNS: () => ipcRenderer.invoke('optimize-dns'),
  fixNetworkAdapters: () => ipcRenderer.invoke('fix-network-adapters'),
  resetFirewall: () => ipcRenderer.invoke('reset-firewall'),
  fixSlowInternet: () => ipcRenderer.invoke('fix-slow-internet'),
  fullInternetRepair: () => ipcRenderer.invoke('full-internet-repair'),

  getStartupItems: () => ipcRenderer.invoke('get-startup-items'),
  toggleStartupItem: (registryKey, name, enable) => ipcRenderer.invoke('toggle-startup-item', registryKey, name, enable),
  removeStartupItem: (registryKey, name) => ipcRenderer.invoke('remove-startup-item', registryKey, name),

  activateGameMode: (selectedProcs) => ipcRenderer.invoke('activate-game-mode', selectedProcs),
  deactivateGameMode: () => ipcRenderer.invoke('deactivate-game-mode'),
  getGameModeStatus: () => ipcRenderer.invoke('get-game-mode-status'),
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),

  getRamInfo: () => ipcRenderer.invoke('get-ram-info'),
  cleanRam: () => ipcRenderer.invoke('clean-ram'),
  setProcessPriority: (processName, priority) => ipcRenderer.invoke('set-process-priority', processName, priority),

  getDiskHealth: () => ipcRenderer.invoke('get-disk-health'),
  checkDiskErrors: (drive) => ipcRenderer.invoke('check-disk-errors', drive),
  getDiskUsage: () => ipcRenderer.invoke('get-disk-usage'),
  getSmartData: (drive) => ipcRenderer.invoke('get-smart-data', drive),

  getPowerPlans: () => ipcRenderer.invoke('get-power-plans'),
  setActivePlan: (guid) => ipcRenderer.invoke('set-active-plan', guid),
  createGamingPlan: () => ipcRenderer.invoke('create-gaming-plan'),
  createPowerSaverPlan: () => ipcRenderer.invoke('create-power-saver-plan'),

  runSpeedTest: () => ipcRenderer.invoke('run-speed-test'),

  getNetworkTweaks: () => ipcRenderer.invoke('get-network-tweaks'),
  getNetworkStatus: () => ipcRenderer.invoke('get-network-status'),
  optimizeNetworkDNS: () => ipcRenderer.invoke('optimize-network-dns'),
  disableNagle: () => ipcRenderer.invoke('disable-nagle'),
  disableThrottling: () => ipcRenderer.invoke('disable-throttling'),
  optimizeQoS: () => ipcRenderer.invoke('optimize-qos'),
  optimizeTCPAutotune: () => ipcRenderer.invoke('optimize-tcp-autotune'),
  disableInterruptModeration: () => ipcRenderer.invoke('disable-interrupt-moderation'),
  optimizeGamePriority: () => ipcRenderer.invoke('optimize-game-priority'),
  applyAllNetworkOptimizations: () => ipcRenderer.invoke('apply-all-network-optimizations'),
  revertNetworkOptimizations: () => ipcRenderer.invoke('revert-network-optimizations'),

  scanNetwork: () => ipcRenderer.invoke('scan-network'),
  getDeviceDetails: (ip) => ipcRenderer.invoke('get-device-details', ip),
  blockDevice: (ip) => ipcRenderer.invoke('block-device', ip),
  unblockDevice: (ip) => ipcRenderer.invoke('unblock-device', ip),
  limitBandwidth: (ip, speed) => ipcRenderer.invoke('limit-bandwidth', ip, speed),
  getBlockedDevices: () => ipcRenderer.invoke('get-blocked-devices'),

  getGPUInfo: () => ipcRenderer.invoke('get-gpu-info'),
  optimizeGPU: () => ipcRenderer.invoke('optimize-gpu'),
  revertGPU: () => ipcRenderer.invoke('revert-gpu'),

  getMouseSettings: () => ipcRenderer.invoke('get-mouse-settings'),
  optimizeMouse: () => ipcRenderer.invoke('optimize-mouse'),
  revertMouse: () => ipcRenderer.invoke('revert-mouse'),

  getPrivacyTweaks: () => ipcRenderer.invoke('get-privacy-tweaks'),
  applyPrivacyTweak: (id) => ipcRenderer.invoke('apply-privacy-tweak', id),
  applyAllPrivacy: () => ipcRenderer.invoke('apply-all-privacy'),

  getTemperatures: () => ipcRenderer.invoke('get-temperatures'),
  getCpuTemp: () => ipcRenderer.invoke('get-cpu-temp'),

  getWifiNetworks: () => ipcRenderer.invoke('get-wifi-networks'),
  getCurrentWifi: () => ipcRenderer.invoke('get-current-wifi'),

  pingOnce: (host) => ipcRenderer.invoke('ping-once', host),
  pingSweep: (host, count) => ipcRenderer.invoke('ping-sweep', host, count),
  getPingPresets: () => ipcRenderer.invoke('get-ping-presets'),

  getContextMenus: () => ipcRenderer.invoke('get-context-menus'),
  removeContextMenu: (path) => ipcRenderer.invoke('remove-context-menu', path),
  addContextMenu: (name, cmd) => ipcRenderer.invoke('add-context-menu', name, cmd),

  getBrowserSizes: () => ipcRenderer.invoke('get-browser-sizes'),
  cleanBrowser: (id) => ipcRenderer.invoke('clean-browser', id),
  cleanAllBrowsers: () => ipcRenderer.invoke('clean-all-browsers'),

  getRestorePoints: () => ipcRenderer.invoke('get-restore-points'),
  createRestorePoint: (desc) => ipcRenderer.invoke('create-restore-point', desc),
  restoreToPoint: (id) => ipcRenderer.invoke('restore-to-point', id),
  getRestoreStatus: () => ipcRenderer.invoke('get-restore-status'),
  enableRestore: (drive) => ipcRenderer.invoke('enable-restore', drive),

  runFullOptimization: () => ipcRenderer.invoke('run-full-optimization'),

  getProcesses: (sortBy) => ipcRenderer.invoke('get-processes', sortBy),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  killProcessByName: (name) => ipcRenderer.invoke('kill-process-by-name', name),
  getProcessDetails: (pid) => ipcRenderer.invoke('get-process-details', pid),
  setProcessPriority: (pid, priority) => ipcRenderer.invoke('set-process-priority', pid, priority),
  getProcessStats: () => ipcRenderer.invoke('get-process-stats'),

  getDefenderStatus: () => ipcRenderer.invoke('get-defender-status'),
  toggleDefenderRealtime: (enable) => ipcRenderer.invoke('toggle-defender-realtime', enable),
  toggleDefenderBehavior: (enable) => ipcRenderer.invoke('toggle-defender-behavior', enable),
  startDefenderScan: (type) => ipcRenderer.invoke('start-defender-scan', type),
  addDefenderExclusion: (path) => ipcRenderer.invoke('add-defender-exclusion', path),
  removeDefenderExclusion: (path) => ipcRenderer.invoke('remove-defender-exclusion', path),
  updateDefenderDefinitions: () => ipcRenderer.invoke('update-defender-definitions'),

  getBSODReports: () => ipcRenderer.invoke('get-bsod-reports'),
  analyzeMinidump: (fileName) => ipcRenderer.invoke('analyze-minidump', fileName),

  findDuplicates: (directories) => ipcRenderer.invoke('find-duplicates', directories),
  deleteDuplicateFiles: (filesToKeep, filesToDelete) => ipcRenderer.invoke('delete-duplicate-files', filesToKeep, filesToDelete),

  getActiveConnections: () => ipcRenderer.invoke('get-active-connections'),
  getNetworkStats: () => ipcRenderer.invoke('get-network-stats'),
  getWifiProfiles: () => ipcRenderer.invoke('get-wifi-profiles'),
  getWifiPassword: (profileName) => ipcRenderer.invoke('get-wifi-password', profileName),

  getServices: () => ipcRenderer.invoke('get-services'),
  startService: (name) => ipcRenderer.invoke('start-service', name),
  stopService: (name) => ipcRenderer.invoke('stop-service', name),
  restartService: (name) => ipcRenderer.invoke('restart-service', name),
  setServiceStartup: (name, startType) => ipcRenderer.invoke('set-service-startup', name, startType),

  getCpuInfo: () => ipcRenderer.invoke('get-cpu-info'),
  runCpuBenchmark: () => ipcRenderer.invoke('run-cpu-benchmark'),

  getFullSystemInfo: () => ipcRenderer.invoke('get-full-system-info'),

  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  uninstallApp: (name, uninstallString) => ipcRenderer.invoke('uninstall-app', name, uninstallString),

  getDriveOverview: () => ipcRenderer.invoke('get-drive-overview'),
  analyzeDirectory: (dirPath, maxDepth) => ipcRenderer.invoke('analyze-directory', dirPath, maxDepth),
  getDirectoryTree: (dirPath, depth, maxSize) => ipcRenderer.invoke('get-directory-tree', dirPath, depth, maxSize),
  getTopFiles: (dirPath, limit) => ipcRenderer.invoke('get-top-files', dirPath, limit),
  deleteDiskItem: (itemPath) => ipcRenderer.invoke('delete-disk-item', itemPath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (e, version) => callback(version)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (e, version) => callback(version)),
  securityAlert: (callback) => ipcRenderer.on('security-alert', (e, type) => callback(type)),

  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),
  checkLicenseStatus: () => ipcRenderer.invoke('check-license-status'),
  getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
  deactivateLicense: () => ipcRenderer.invoke('deactivate-license'),
  getSecurityStatus: () => ipcRenderer.invoke('get-security-status'),
  getCrackAttempts: () => ipcRenderer.invoke('get-crack-attempts'),
  getModificationLogs: () => ipcRenderer.invoke('get-modification-logs'),

  translatorGetScreens: () => ipcRenderer.invoke('translator-get-screens'),
  translatorStart: (opts) => ipcRenderer.invoke('translator-start', opts),
  translatorStop: () => ipcRenderer.invoke('translator-stop'),
  translatorUpdateSettings: (opts) => ipcRenderer.invoke('translator-update-settings', opts),
  translatorGetSettings: () => ipcRenderer.invoke('translator-get-settings'),
  translatorShowOverlay: () => ipcRenderer.invoke('translator-show-overlay'),
  translatorHideOverlay: () => ipcRenderer.invoke('translator-hide-overlay'),
  translatorCaptureOnce: (opts) => ipcRenderer.invoke('translator-capture-once', opts),
  translatorGetHistory: () => ipcRenderer.invoke('translator-get-history'),
  onTranslatorResult: (callback) => ipcRenderer.on('translator-result', (e, data) => callback(data)),

  discordRpcStart: () => ipcRenderer.invoke('discord-rpc-start'),
  discordRpcStop: () => ipcRenderer.invoke('discord-rpc-stop'),
  discordRpcStatus: () => ipcRenderer.invoke('discord-rpc-status'),
  discordRpcToggle: (val) => ipcRenderer.invoke('discord-rpc-toggle', val),

  getInstalledBloatware: () => ipcRenderer.invoke('get-installed-bloatware'),
  uninstallBloatware: (pkgName) => ipcRenderer.invoke('uninstall-bloatware', pkgName),
  uninstallAllBloatware: () => ipcRenderer.invoke('uninstall-all-bloatware'),
  getBloatwareCategories: () => ipcRenderer.invoke('get-bloatware-categories'),

  getSsdTweaks: () => ipcRenderer.invoke('get-ssd-tweaks'),
  applySsdTweak: (id) => ipcRenderer.invoke('apply-ssd-tweak', id),
  applyAllSsdTweaks: () => ipcRenderer.invoke('apply-all-ssd-tweaks'),
  revertAllSsdTweaks: () => ipcRenderer.invoke('revert-all-ssd-tweaks'),

  getVisualTweaks: () => ipcRenderer.invoke('get-visual-tweaks'),
  applyVisualTweak: (id) => ipcRenderer.invoke('apply-visual-tweak', id),
  applyAllVisualTweaks: () => ipcRenderer.invoke('apply-all-visual-tweaks'),
  revertAllVisualTweaks: () => ipcRenderer.invoke('revert-all-visual-tweaks'),

  getInputLagTweaks: () => ipcRenderer.invoke('get-input-lag-tweaks'),
  applyInputLagTweak: (id) => ipcRenderer.invoke('apply-input-lag-tweak', id),
  applyAllInputLagFixes: () => ipcRenderer.invoke('apply-all-input-lag-fixes'),
  revertAllInputLagFixes: () => ipcRenderer.invoke('revert-all-input-lag-fixes'),

  getNetTurboboostTweaks: () => ipcRenderer.invoke('get-net-turboboost-tweaks'),
  applyNetTurboboostTweak: (id) => ipcRenderer.invoke('apply-net-turboboost-tweak', id),
  applyAllNetTurboboost: () => ipcRenderer.invoke('apply-all-net-turboboost'),
  revertAllNetTurboboost: () => ipcRenderer.invoke('revert-all-net-turboboost'),

  blockWindowsUpdate: () => ipcRenderer.invoke('block-windows-update'),
  unblockWindowsUpdate: () => ipcRenderer.invoke('unblock-windows-update'),
  getWindowsUpdateStatus: () => ipcRenderer.invoke('get-windows-update-status'),

  getAllStoreApps: () => ipcRenderer.invoke('get-all-store-apps'),
  getAllProvisionedApps: () => ipcRenderer.invoke('get-all-provisioned-apps'),
  removeStoreApp: (fullName) => ipcRenderer.invoke('remove-store-app', fullName),
  removeProvisionedApp: (pkgName) => ipcRenderer.invoke('remove-provisioned-app', pkgName),
  removeMultipleStoreApps: (apps) => ipcRenderer.invoke('remove-multiple-store-apps', apps),

  getMemoryStatus: () => ipcRenderer.invoke('get-memory-status'),
  cleanMemoryOnce: () => ipcRenderer.invoke('clean-memory-once'),
  startAutoClean: (ms) => ipcRenderer.invoke('start-auto-clean', ms),
  stopAutoClean: () => ipcRenderer.invoke('stop-auto-clean'),
  isAutoCleanRunning: () => ipcRenderer.invoke('is-auto-clean-running'),
  onAutoCleanUpdate: (callback) => { ipcRenderer.on('auto-clean-update', (event, data) => callback(data)); },

  getGameFpsProfiles: () => ipcRenderer.invoke('get-game-fps-profiles'),
  saveGameFpsProfile: (name, settings) => ipcRenderer.invoke('save-game-fps-profile', name, settings),
  updateGameFpsProfile: (id, name, settings) => ipcRenderer.invoke('update-game-fps-profile', id, name, settings),
  deleteGameFpsProfile: (id) => ipcRenderer.invoke('delete-game-fps-profile', id),
  resetGameFpsProfiles: () => ipcRenderer.invoke('reset-game-fps-profiles'),

  onFpsOverlayData: (callback) => { ipcRenderer.on('fps-overlay-data', (event, data) => callback(data)); },

  startFpsOverlay: () => ipcRenderer.invoke('start-fps-overlay'),
  stopFpsOverlay: () => ipcRenderer.invoke('stop-fps-overlay'),
  isFpsOverlayRunning: () => ipcRenderer.invoke('is-fps-overlay-running'),
  toggleOverlayMouse: (passthrough) => ipcRenderer.invoke('toggle-overlay-mouse', passthrough)
});
