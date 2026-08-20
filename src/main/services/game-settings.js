const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

const USERPROFILE = process.env.USERPROFILE || os.homedir();

async function getAllDrives() {
  const drives = [];
  try {
    const output = await runPs('wmic logicaldisk get DeviceID', 5000);
    const lines = output.trim().split('\n').filter(l => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const d = lines[i].trim();
      if (d && d.match(/^[A-Z]:/)) drives.push(d);
    }
  } catch (e) {
    drives.push('C:\\', 'D:\\', 'E:\\', 'F:\\');
  }
  if (drives.length === 0) drives.push('C:\\', 'D:\\', 'E:\\', 'F:\\');
  return drives;
}

async function getAllSteamLibraries() {
  const libraries = new Set();
  const checked = new Set();

  const steamPaths = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    'D:\\Steam',
    'E:\\Steam',
    'F:\\Steam',
    'D:\\SteamLibrary',
    'E:\\SteamLibrary',
    'F:\\SteamLibrary',
    'G:\\SteamLibrary'
  ];

  for (const steamPath of steamPaths) {
    if (!fs.existsSync(steamPath) || checked.has(steamPath)) continue;
    checked.add(steamPath);

    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.json');
    if (fs.existsSync(libraryFoldersPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(libraryFoldersPath, 'utf-8'));
        for (const key of Object.keys(data)) {
          const lib = data[key];
          if (lib.path) {
            libraries.add(lib.path);
          }
        }
      } catch (e) {}
    }

    const commonPath = path.join(steamPath, 'steamapps', 'common');
    if (fs.existsSync(commonPath)) {
      libraries.add(steamPath);
    }
  }

  const allDrives = await getAllDrives();
  for (const drive of allDrives) {
    const possibleSteam = [
      path.join(drive, 'Steam'),
      path.join(drive, 'SteamLibrary'),
      path.join(drive, 'Games', 'Steam'),
      path.join(drive, 'Games', 'SteamLibrary')
    ];
    for (const p of possibleSteam) {
      if (!fs.existsSync(p) || checked.has(p)) continue;
      checked.add(p);
      const commonPath = path.join(p, 'steamapps', 'common');
      if (fs.existsSync(commonPath)) {
        libraries.add(p);
      }
    }
  }

  return [...libraries];
}

function scanSteamGames() {
  const games = [];
  const libraries = getAllSteamLibrariesSync();

  for (const libPath of libraries) {
    const steamappsPath = path.join(libPath, 'steamapps');
    if (!fs.existsSync(steamappsPath)) continue;

    try {
      const files = fs.readdirSync(steamappsPath);
      const manifestFiles = files.filter(f => f.startsWith('appmanifest_'));

      for (const manifest of manifestFiles) {
        try {
          const content = fs.readFileSync(path.join(steamappsPath, manifest), 'utf-8');
          const nameMatch = content.match(/"name"\s+"(.+?)"/);
          const pathMatch = content.match(/"installdir"\s+"(.+?)"/);

          if (nameMatch && pathMatch) {
            const gamePath = path.join(libPath, 'steamapps', 'common', pathMatch[1]);
            if (fs.existsSync(gamePath)) {
              const configs = findConfigFiles(gamePath);
              games.push({
                name: nameMatch[1],
                path: gamePath,
                platform: 'Steam',
                configs: configs,
                installed: true
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

function getAllSteamLibrariesSync() {
  const libraries = new Set();
  const checked = new Set();

  const steamPaths = [
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
    'D:\\Steam',
    'E:\\Steam',
    'F:\\Steam',
    'D:\\SteamLibrary',
    'E:\\SteamLibrary',
    'F:\\SteamLibrary',
    'G:\\SteamLibrary'
  ];

  for (const steamPath of steamPaths) {
    if (!fs.existsSync(steamPath) || checked.has(steamPath)) continue;
    checked.add(steamPath);

    const libraryFoldersPath = path.join(steamPath, 'steamapps', 'libraryfolders.json');
    if (fs.existsSync(libraryFoldersPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(libraryFoldersPath, 'utf-8'));
        for (const key of Object.keys(data)) {
          const lib = data[key];
          if (lib.path) {
            libraries.add(lib.path);
          }
        }
      } catch (e) {}
    }

    const commonPath = path.join(steamPath, 'steamapps', 'common');
    if (fs.existsSync(commonPath)) {
      libraries.add(steamPath);
    }
  }

  const defaultDrives = ['C:\\', 'D:\\', 'E:\\', 'F:\\'];
  for (const drive of defaultDrives) {
    const possibleSteam = [
      path.join(drive, 'Steam'),
      path.join(drive, 'SteamLibrary'),
      path.join(drive, 'Games', 'Steam'),
      path.join(drive, 'Games', 'SteamLibrary')
    ];
    for (const p of possibleSteam) {
      if (!fs.existsSync(p) || checked.has(p)) continue;
      checked.add(p);
      const commonPath = path.join(p, 'steamapps', 'common');
      if (fs.existsSync(commonPath)) {
        libraries.add(p);
      }
    }
  }

  return [...libraries];
}

function scanEpicGames() {
  const games = [];
  const manifestPaths = [
    path.join(USERPROFILE, 'AppData', 'Local', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests'),
    'C:\\ProgramData\\Epic\\EpicGamesBrowser\\Data\\Manifests',
    path.join(USERPROFILE, 'AppData', 'Local', 'EpicGamesLauncher', 'Data', 'Manifests')
  ];

  for (const manifestPath of manifestPaths) {
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const files = fs.readdirSync(manifestPath).filter(f => f.endsWith('.item'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(manifestPath, file), 'utf-8');
          const data = JSON.parse(content);
          if (data.InstallLocation && data.DisplayName) {
            if (fs.existsSync(data.InstallLocation)) {
              const configs = findConfigFiles(data.InstallLocation);
              games.push({
                name: data.DisplayName,
                path: data.InstallLocation,
                platform: 'Epic',
                configs: configs,
                installed: true
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

function scanOriginGames() {
  const games = [];
  const originPaths = [
    'C:\\Program Files (x86)\\Origin Games',
    'C:\\Program Files\\Origin Games',
    'D:\\Origin Games',
    'E:\\Origin Games',
    'C:\\Program Files\\EA Games',
    'C:\\Program Files (x86)\\EA Games'
  ];

  for (const originPath of originPaths) {
    if (!fs.existsSync(originPath)) continue;
    try {
      const items = fs.readdirSync(originPath);
      for (const item of items) {
        const itemPath = path.join(originPath, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            const configs = findConfigFiles(itemPath);
            games.push({
              name: item,
              path: itemPath,
              platform: 'EA/Origin',
              configs: configs,
              installed: true
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

function scanUbisoftGames() {
  const games = [];
  const ubisoftPaths = [
    'C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games',
    'C:\\Program Files\\Ubisoft',
    'C:\\Program Files (x86)\\Ubisoft',
    'D:\\Ubisoft',
    'E:\\Ubisoft'
  ];

  for (const ubisoftPath of ubisoftPaths) {
    if (!fs.existsSync(ubisoftPath)) continue;
    try {
      const items = fs.readdirSync(ubisoftPath);
      for (const item of items) {
        const itemPath = path.join(ubisoftPath, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            const configs = findConfigFiles(itemPath);
            if (configs.length > 0 || hasExecutable(itemPath)) {
              games.push({
                name: item,
                path: itemPath,
                platform: 'Ubisoft',
                configs: configs,
                installed: true
              });
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

function scanGOGGames() {
  const games = [];
  const gogPaths = [
    'C:\\Program Files (x86)\\GOG Galaxy\\Games',
    'C:\\GOG Games',
    'D:\\GOG Games',
    'E:\\GOG Games'
  ];

  for (const gogPath of gogPaths) {
    if (!fs.existsSync(gogPath)) continue;
    try {
      const items = fs.readdirSync(gogPath);
      for (const item of items) {
        const itemPath = path.join(gogPath, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            const configs = findConfigFiles(itemPath);
            games.push({
              name: item,
              path: itemPath,
              platform: 'GOG',
              configs: configs,
              installed: true
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

async function scanLocalGames() {
  const games = [];
  const drives = await getAllDrives();

  const folderNames = [
    'Games', 'games', 'Game', 'GAMES',
    'Program Files', 'Program Files (x86)',
    'Riot Games', 'Blizzard', 'Battle.net',
    'Rockstar Games', 'CD Projekt Red', 'Mojang',
    'XboxGames', 'WindowsApps'
  ];

  for (const drive of drives) {
    for (const folder of folderNames) {
      const checkPath = path.join(drive, folder);
      if (!fs.existsSync(checkPath)) continue;

      try {
        const items = fs.readdirSync(checkPath);
        for (const item of items) {
          const itemPath = path.join(checkPath, item);
          try {
            const stat = fs.statSync(itemPath);
            if (!stat.isDirectory()) continue;

            const hasExe = hasExecutable(itemPath);
            const configs = findConfigFiles(itemPath);

            if (configs.length > 0 || hasExe) {
              games.push({
                name: item,
                path: itemPath,
                platform: 'Local',
                configs: configs,
                installed: hasExe
              });
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
  }

  const userFolders = [
    path.join(USERPROFILE, 'AppData', 'Local'),
    path.join(USERPROFILE, 'AppData', 'Roaming'),
    path.join(USERPROFILE, 'Documents', 'My Games'),
    path.join(USERPROFILE, 'Documents'),
    path.join(USERPROFILE, 'Videos'),
    path.join(USERPROFILE, 'Downloads')
  ];

  for (const userFolder of userFolders) {
    if (!fs.existsSync(userFolder)) continue;
    try {
      const items = fs.readdirSync(userFolder);
      for (const item of items) {
        const itemPath = path.join(userFolder, item);
        try {
          const stat = fs.statSync(itemPath);
          if (!stat.isDirectory()) continue;

          const configs = findConfigFiles(itemPath);
          if (configs.length > 0) {
            games.push({
              name: item,
              path: itemPath,
              platform: 'Local',
              configs: configs,
              installed: true
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  return games;
}

function hasExecutable(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    return items.some(item => {
      const lower = item.toLowerCase();
      return lower.endsWith('.exe') && !lower.includes('uninstall') && !lower.includes('setup');
    });
  } catch (e) {
    return false;
  }
}

function findConfigFiles(dirPath) {
  const configs = [];

  function search(currentPath, depth) {
    if (depth > 6) return;
    try {
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        try {
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            search(itemPath, depth + 1);
          } else {
            const ext = path.extname(item).toLowerCase();
            const name = item.toLowerCase();

            if (ext === '.ini' && name.endsWith('.ini')) {
              configs.push({ path: itemPath, type: 'ini', name: item });
            } else if (ext === '.json' && (name.endsWith('.json') && !name.includes('package'))) {
              const configJsons = [
                'settings.json', 'config.json', 'options.json', 'game.json',
                'video.json', 'graphics.json', 'graphicsoptions.json',
                'gamesettings.json', 'usersettings.json', 'performance.json',
                'engine.ini.json', 'scalability.ini.json'
              ];
              if (configJsons.some(cn => name === cn)) {
                configs.push({ path: itemPath, type: 'json', name: item });
              }
            } else if (ext === '.cfg' && name.endsWith('.cfg')) {
              configs.push({ path: itemPath, type: 'cfg', name: item });
            } else if (ext === '.xml' && name.endsWith('.xml')) {
              const configXmls = [
                'settings.xml', 'config.xml', 'options.xml', 'graphics.xml',
                'gamesettings.xml', 'videosettings.xml'
              ];
              if (configXmls.some(cn => name === cn)) {
                configs.push({ path: itemPath, type: 'xml', name: item });
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  search(dirPath, 0);
  return configs;
}

async function scanAllGames() {
  const allGames = [];
  const seen = new Set();

  const syncScanners = [
    scanSteamGames,
    scanEpicGames,
    scanOriginGames,
    scanUbisoftGames,
    scanGOGGames
  ];

  for (const scanner of syncScanners) {
    try {
      const games = scanner();
      for (const game of games) {
        const key = game.path.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          allGames.push(game);
        }
      }
    } catch (e) {}
  }

  try {
    const localGames = await scanLocalGames();
    for (const game of localGames) {
      const key = game.path.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        allGames.push(game);
      }
    }
  } catch (e) {}

  allGames.sort((a, b) => {
    if (a.configs.length > 0 && b.configs.length === 0) return -1;
    if (a.configs.length === 0 && b.configs.length > 0) return 1;
    const platformOrder = { Steam: 0, Epic: 1, 'EA/Origin': 2, Ubisoft: 3, GOG: 4, Local: 5 };
    const aOrder = platformOrder[a.platform] ?? 6;
    const bOrder = platformOrder[b.platform] ?? 6;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  return allGames;
}

async function scanGames() {
  return await scanAllGames();
}

const PRESETS = {
  performance: {
    name: 'أقصى أداء',
    description: 'أقل ضغط على الجهاز - أعلى FPS ممكن',
    settings: {
      'sg.ResolutionQuality': '50',
      'sg.ViewDistanceQuality': '0',
      'sg.AntiAliasingQuality': '0',
      'sg.ShadowQuality': '0',
      'sg.PostProcessQuality': '0',
      'sg.TextureQuality': '0',
      'sg.EffectsQuality': '0',
      'sg.FoliageQuality': '0',
      'sg.ShadingQuality': '0',
      'r.ScreenPercentage': '75',
      'r.DynamicRes.OperationMode': '2',
      'r.DynamicRes.MinScreenPercentage': '50',
      'r.DynamicRes.MaxScreenPercentage': '75',
      't.MaxFPS': '0',
      'bUseVSync': 'False',
      'r.BloomQuality': '0',
      'r.DepthOfFieldQuality': '0',
      'r.RefractionQuality': '0',
      'r.SSR.Quality': '0',
      'r.AmbientOcclusionLevels': '0',
      'r.MotionBlurQuality': '0',
      'r.Tonemapper.GrainQuantization': '0',
      'r.FogQuality': '0',
      'r.Shaders.FastMath': '1',
      'r.Shaders.Optimize': '1',
      'sg.StreamingPoolSize': '512',
      'r.Streaming.PoolSize': '512',
      'r.RHICmdBypass': '1',
      'r.OneFrameThreadLag': '1'
    }
  },
  balanced: {
    name: 'متوازن',
    description: 'توازن بين الأداء والجودة',
    settings: {
      'sg.ResolutionQuality': '85',
      'sg.ViewDistanceQuality': '2',
      'sg.AntiAliasingQuality': '2',
      'sg.ShadowQuality': '2',
      'sg.PostProcessQuality': '2',
      'sg.TextureQuality': '2',
      'sg.EffectsQuality': '2',
      'sg.FoliageQuality': '1',
      'sg.ShadingQuality': '2',
      'r.ScreenPercentage': '90',
      'r.DynamicRes.OperationMode': '1',
      'r.DynamicRes.MinScreenPercentage': '75',
      'r.DynamicRes.MaxScreenPercentage': '100',
      'bUseVSync': 'False',
      'r.BloomQuality': '3',
      'r.DepthOfFieldQuality': '2',
      'r.MotionBlurQuality': '0',
      'r.SSR.Quality': '2',
      'r.Shaders.FastMath': '1',
      'sg.StreamingPoolSize': '1024',
      'r.Streaming.PoolSize': '1024'
    }
  },
  quality: {
    name: 'أقصى جودة',
    description: 'أعلى جودة ممكنة',
    settings: {
      'sg.ResolutionQuality': '100',
      'sg.ViewDistanceQuality': '4',
      'sg.AntiAliasingQuality': '4',
      'sg.ShadowQuality': '4',
      'sg.PostProcessQuality': '4',
      'sg.TextureQuality': '4',
      'sg.EffectsQuality': '4',
      'sg.FoliageQuality': '4',
      'sg.ShadingQuality': '4',
      'r.ScreenPercentage': '100',
      'bUseVSync': 'True',
      'r.BloomQuality': '5',
      'r.DepthOfFieldQuality': '4',
      'r.MotionBlurQuality': '4',
      'r.SSR.Quality': '4',
      'r.AmbientOcclusionLevels': '4',
      'r.Shaders.FastMath': '0',
      'sg.StreamingPoolSize': '2048',
      'r.Streaming.PoolSize': '2048',
      'r.Tonemapper.GrainQuantization': '1'
    }
  },
  competitive: {
    name: 'تنافسي',
    description: 'للألعاب التنافسية - أقل تأخير + رؤية واضحة',
    settings: {
      'sg.ResolutionQuality': '100',
      'sg.ViewDistanceQuality': '3',
      'sg.AntiAliasingQuality': '0',
      'sg.ShadowQuality': '0',
      'sg.PostProcessQuality': '0',
      'sg.TextureQuality': '3',
      'sg.EffectsQuality': '1',
      'sg.FoliageQuality': '0',
      'sg.ShadingQuality': '1',
      'r.ScreenPercentage': '100',
      'bUseVSync': 'False',
      'r.BloomQuality': '0',
      'r.DepthOfFieldQuality': '0',
      'r.MotionBlurQuality': '0',
      'r.SSR.Quality': '0',
      'r.AmbientOcclusionLevels': '0',
      'r.FogQuality': '0',
      'r.Shaders.FastMath': '1',
      'r.Shaders.Optimize': '1',
      'sg.StreamingPoolSize': '768',
      'r.Streaming.PoolSize': '768',
      't.MaxFPS': '0',
      'r.OneFrameThreadLag': '1'
    }
  }
};

function backupConfig(configPath) {
  const backupDir = path.join(path.dirname(configPath), 'JA7EM_Backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, path.basename(configPath) + '.backup');
  fs.copyFileSync(configPath, backupPath);
  return backupPath;
}

function applyINISettings(configPath, settings) {
  let content = '';
  try {
    content = fs.readFileSync(configPath, 'utf-8');
  } catch (e) {
    content = '[/Script/Engine.GameUserSettings]\n';
  }

  const section = '[/Script/Engine.GameUserSettings]';
  for (const [key, value] of Object.entries(settings)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[ \\t]*${escapedKey}[ \\t]*=[ \\t]*.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      if (!content.includes(section)) {
        content = section + '\n' + content;
      }
      content = content.replace(section, `${section}\n${key}=${value}`);
    }
  }

  fs.writeFileSync(configPath, content, 'utf-8');
}

function applyJSONSettings(configPath, settings) {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (e) {
    data = {};
  }

  for (const [key, value] of Object.entries(settings)) {
    const keys = key.split('.');
    let current = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
}

function applyGamePreset(gamePath, presetName, configs) {
  const preset = PRESETS[presetName];
  if (!preset) return { status: 'failed', message: 'Preset not found' };

  const results = [];

  for (const config of configs) {
    try {
      backupConfig(config.path);

      if (config.type === 'ini' || config.type === 'cfg') {
        applyINISettings(config.path, preset.settings);
      } else if (config.type === 'json') {
        applyJSONSettings(config.path, preset.settings);
      }

      results.push({ file: config.name, status: 'success' });
    } catch (error) {
      results.push({ file: config.name, status: 'failed', error: error.message });
    }
  }

  return {
    status: 'success',
    preset: preset.name,
    results: results
  };
}

function revertGameConfigs(gamePath) {
  const backupDir = path.join(gamePath, 'JA7EM_Backup');
  if (!fs.existsSync(backupDir)) {
    return { status: 'failed', message: 'لا توجد نسخة احتياطية' };
  }

  try {
    const backups = fs.readdirSync(backupDir);
    for (const backup of backups) {
      if (backup.endsWith('.backup')) {
        const originalName = backup.replace('.backup', '');
        const originalPath = path.join(gamePath, originalName);
        const backupPath = path.join(backupDir, backup);
        fs.copyFileSync(backupPath, originalPath);
      }
    }
    return { status: 'success', message: 'تمت إعادة جميع الإعدادات' };
  } catch (error) {
    return { status: 'failed', message: 'فشل إعادة الإعدادات' };
  }
}

module.exports = {
  scanGames,
  applyGamePreset,
  revertGameConfigs,
  PRESETS
};
