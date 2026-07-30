const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

function runFire(cmd, timeout = 10000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout }, () => resolve());
  });
}

const BLOATWARE_LIST = [
  { name: '3D Builder', pkg: '3DBuilder', category: 'تطبيقات' },
  { name: 'Bing Weather', pkg: 'Microsoft.BingWeather', category: 'تطبيقات' },
  { name: 'Bing News', pkg: 'Microsoft.BingNews', category: 'تطبيقات' },
  { name: 'Bing Sports', pkg: 'Microsoft.BingSports', category: 'تطبيقات' },
  { name: 'Bing Finance', pkg: 'Microsoft.BingFinance', category: 'تطبيقات' },
  { name: 'Candy Crush', pkg: 'king.com.CandyCrush*', category: 'تطبيقات' },
  { name: 'Candy Crush Soda', pkg: 'king.com.CandyCrushSoda*', category: 'تطبيقات' },
  { name: 'Disney', pkg: 'Disney*', category: 'تطبيقات' },
  { name: 'Drawboard PDF', pkg: 'Drawboard.DrawboardPDF', category: 'تطبيقات' },
  { name: 'Duolingo', pkg: 'Duolingo-LearnLanguagesforFree', category: 'تطبيقات' },
  { name: 'Eclipse Manager', pkg: 'EclipseManager', category: 'تطبيقات' },
  { name: 'Facebook', pkg: 'Facebook', category: 'تطبيقات' },
  { name: 'Farm Heroes', pkg: 'FarmHeroes*', category: 'تطبيقات' },
  { name: 'Get Help', pkg: 'Microsoft.GetHelp', category: 'تطبيقات' },
  { name: 'Get Started', pkg: 'Microsoft.Getstarted', category: 'تطبيقات' },
  { name: 'Groove Music', pkg: 'Microsoft.ZuneMusic', category: 'تطبيقات' },
  { name: 'Hololens', pkg: 'Microsoft.Hololens', category: 'تطبيقات' },
  { name: 'Instagram', pkg: 'Instagram', category: 'تطبيقات' },
  { name: 'LinkedIn', pkg: 'LinkedInforWindows', category: 'تطبيقات' },
  { name: 'Mail & Calendar', pkg: 'Microsoft.windowscommunicationsapps', category: 'تطبيقات' },
  { name: 'Maps', pkg: 'Microsoft.WindowsMaps', category: 'تطبيقات' },
  { name: 'Messaging', pkg: 'Microsoft.Messaging', category: 'تطبيقات' },
  { name: 'Microsoft Edge', pkg: 'Microsoft.MicrosoftEdge', category: 'متصفحات' },
  { name: 'Microsoft News', pkg: 'Microsoft.MicrosoftNews', category: 'تطبيقات' },
  { name: 'Microsoft Pay', pkg: 'Microsoft.Wallet', category: 'تطبيقات' },
  { name: 'Microsoft People', pkg: 'Microsoft.People', category: 'تطبيقات' },
  { name: 'Microsoft Solitaire', pkg: 'Microsoft.MicrosoftSolitaireCollection', category: 'ألعاب' },
  { name: 'Mixed Reality', pkg: 'Microsoft.MixedReality*', category: 'تطبيقات' },
  { name: 'Money (Bing)', pkg: 'Microsoft.BingMoney', category: 'تطبيقات' },
  { name: 'Movies & TV', pkg: 'Microsoft.ZuneVideo', category: 'تطبيقات' },
  { name: 'MS Office Hub', pkg: 'Microsoft.MicrosoftOfficeHub', category: 'تطبيقات' },
  { name: 'MS Paint 3D', pkg: 'Microsoft.MSPaint', category: 'تطبيقات' },
  { name: 'My Office', pkg: 'Microsoft.MicrosoftOfficeHub', category: 'تطبيقات' },
  { name: 'Netflix', pkg: 'Netflix', category: 'تطبيقات' },
  { name: 'Office Lens', pkg: 'Microsoft.OfficeLens', category: 'تطبيقات' },
  { name: 'OneConnect', pkg: 'Microsoft.OneConnect', category: 'تطبيقات' },
  { name: 'OneNote', pkg: 'Microsoft.Office.OneNote', category: 'تطبيقات' },
  { name: 'Paint 3D', pkg: 'Microsoft.MSPaint', category: 'تطبيقات' },
  { name: 'Phone Companion', pkg: 'Microsoft.PhoneCompanion', category: 'تطبيقات' },
  { name: 'Photos', pkg: 'Microsoft.Windows.Photos', category: 'تطبيقات' },
  { name: 'Power BI', pkg: 'Microsoft.PowerBI', category: 'تطبيقات' },
  { name: 'Print 3D', pkg: 'Microsoft.Print3D', category: 'تطبيقات' },
  { name: 'Remote Desktop', pkg: 'Microsoft.RemoteDesktop', category: 'تطبيقات' },
  { name: 'Skype', pkg: 'Microsoft.SkypeApp', category: 'تطبيقات' },
  { name: 'Skype Preview', pkg: 'Microsoft.Skype*', category: 'تطبيقات' },
  { name: 'Spotify', pkg: 'SpotifyAB.SpotifyMusic', category: 'تطبيقات' },
  { name: 'Sticky Notes', pkg: 'Microsoft.MicrosoftStickyNotes', category: 'تطبيقات' },
  { name: 'Sway', pkg: 'Microsoft.Office.Sway', category: 'تطبيقات' },
  { name: 'Teams', pkg: 'MicrosoftTeams*', category: 'تطبيقات' },
  { name: 'Twitter', pkg: 'Twitter', category: 'تطبيقات' },
  { name: 'Voice Recorder', pkg: 'Microsoft.WindowsSoundRecorder', category: 'تطبيقات' },
  { name: 'Whiteboard', pkg: 'Microsoft.Whiteboard', category: 'تطبيقات' },
  { name: 'Windows Alarms', pkg: 'Microsoft.WindowsAlarms', category: 'تطبيقات' },
  { name: 'Windows Camera', pkg: 'Microsoft.WindowsCamera', category: 'تطبيقات' },
  { name: 'Windows Feedback Hub', pkg: 'Microsoft.WindowsFeedbackHub', category: 'تطبيقات' },
  { name: 'Windows Holographic', pkg: 'Microsoft.Windows.Holographic', category: 'تطبيقات' },
  { name: 'Windows Mixed Reality', pkg: 'Microsoft.MixedReality*', category: 'تطبيقات' },
  { name: 'Windows Voice Packs', pkg: 'Microsoft.LanguagePackage*', category: 'تطبيقات' },
  { name: 'Xbox App', pkg: 'Microsoft.XboxApp', category: 'ألعاب' },
  { name: 'Xbox Game Bar', pkg: 'Microsoft.XboxGamingOverlay', category: 'ألعاب' },
  { name: 'Xbox Game Speech', pkg: 'Microsoft.XboxSpeechToTextOverlay', category: 'ألعاب' },
  { name: 'Xbox Identity', pkg: 'Microsoft.XboxIdentityProvider', category: 'ألعاب' },
  { name: 'Xbox TCUI', pkg: 'Microsoft.Xbox.TCUI', category: 'ألعاب' },
  { name: 'Your Phone', pkg: 'Microsoft.YourPhone', category: 'تطبيقات' },
  { name: 'Xbox Game Bar Plugin', pkg: 'Microsoft.XboxGameCallableUI', category: 'ألعاب' }
];

const CAPABILITY_PACKAGES = [
  { name: 'Xbox Gaming (عبر CAPABILITY)', cmd: 'Get-WindowsCapability -Online | Where-Object {$_.Name -like "Xbox*"}' }
];

async function getInstalledBloatware() {
  const results = [];
  try {
    const output = await runPs('powershell -NoProfile -Command "Get-AppxPackage | Select-Object PackageFullName, Name | ConvertTo-Json -Compress"', 30000);
    const packages = JSON.parse(output);
    const arr = Array.isArray(packages) ? packages : [packages];
    for (const bloat of BLOATWARE_LIST) {
      const pkgName = bloat.pkg.toLowerCase().replace('*', '');
      const found = arr.filter(p => p && p.Name && p.Name.toLowerCase().includes(pkgName));
      if (found.length > 0) {
        results.push({ name: bloat.name, pkg: bloat.pkg, category: bloat.category, installed: true, packages: found.map(f => f.PackageFullName) });
      }
    }
  } catch (e) {}
  return results;
}

async function uninstallBloatware(pkgName) {
  const results = [];
  try {
    const output = await runPs(`powershell -NoProfile -Command "Get-AppxPackage \\"*${pkgName}*\\" | Remove-AppxPackage"`, 60000);
    results.push({ name: pkgName, status: 'success', detail: 'تمت الإزالة' });
  } catch (e) {
    try {
      await runPs(`powershell -NoProfile -Command "Get-AppxProvisionedPackage -Online | Where-Object {\\$_.DisplayName -like \\"*${pkgName}*\\"} | Remove-AppxProvisionedPackage -Online"`, 60000);
      results.push({ name: pkgName, status: 'success', detail: 'تمت الإزالة (Provisioned)' });
    } catch (e2) {
      results.push({ name: pkgName, status: 'failed', detail: e2.message });
    }
  }
  return results;
}

async function uninstallAllBloatware() {
  const results = [];
  for (const bloat of BLOATWARE_LIST) {
    try {
      const r = await uninstallBloatware(bloat.pkg.replace('*', ''));
      results.push(...r);
    } catch (e) {
      results.push({ name: bloat.name, status: 'failed' });
    }
  }
  return results;
}

async function getBloatwareCategories() {
  const cats = {};
  for (const b of BLOATWARE_LIST) {
    if (!cats[b.category]) cats[b.category] = [];
    cats[b.category].push({ name: b.name, pkg: b.pkg });
  }
  return cats;
}

module.exports = { getInstalledBloatware, uninstallBloatware, uninstallAllBloatware, getBloatwareCategories, BLOATWARE_LIST };
