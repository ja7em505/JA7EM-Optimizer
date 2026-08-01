<div align="center">

# 🚀 CJ Optimizer

**The All-in-One PC Gaming Optimizer — Boost FPS, Clean Your System, Repair & Monitor Everything**

![Version](https://img.shields.io/badge/version-1.1.6-5865F2)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-00A4EF)
![Electron](https://img.shields.io/badge/Electron-37-green)
![License](https://img.shields.io/badge/license-MIT-blue)

> ⚡ One tool. Every tweak. Maximum performance. 🎮

</div>

---

## 📖 About

**CJ Optimizer** is a powerful, all-in-one optimization suite for Windows built with Electron. It gives gamers and everyday users everything they need to **boost FPS**, **clean up junk**, **repair Windows**, and **monitor system health** — all from one beautiful, easy-to-use interface.

No more jumping between 10 different tools. Everything is here. 🛠️

---

## ✨ Key Features

### ⚡ Performance & FPS
- **FPS Boost** — one-click registry & process tweaks for higher FPS
- **Game Mode** — focus all system resources on your game
- **Auto Memory Cleaner** — automatically keeps your RAM free
- **RAM Optimizer** — manual memory cleanup on demand
- **FPS Overlay** — see your FPS in-game, in real time
- **Game FPS Profiles** — save & load per-game performance profiles
- **GPU Optimizer** — tune your graphics card for gaming
- **CPU Benchmark** — test your processor's power
- **SSD Optimizer** — tweaks to keep your SSD fast
- **Power Plans** — create the perfect gaming power plan
- **Visual Effects** — optimize Windows visuals for speed
- **Input Lag Fixer** — reduce input delay in games
- **Mouse Latency** — minimize mouse click/response lag

### 🧹 System Cleanup
- **System Cleaner** — remove junk, temp files & leftovers
- **Browser Cleanup** — clear cache from all major browsers
- **Duplicate Finder** — find & remove duplicate files
- **Disk Analyzer** — see what's eating your storage
- **Bloatware Remover** — uninstall unwanted pre-installed apps
- **Startup Manager** — control what runs at boot
- **App Uninstaller** — cleanly remove installed programs
- **Windows Apps Uninstaller** — remove Store & provisioned apps

### 🛠️ System Repair
- **Windows Repair** — SFC, DISM, registry & DLL fixes
- **Internet Repair** — reset TCP/IP, Winsock, DNS & firewall
- **Network Optimizer** — DNS, QoS & TCP tweaks for lower ping
- **Network Turbo** — maximum network throughput
- **Windows Update Blocker** — take control of updates
- **BSOD Analyzer** — read & understand blue screen crashes
- **Restore Points** — create & restore system backups

### 🛡️ Security & Privacy
- **Defender Manager** — full control over Windows Defender
- **Privacy Tweaks** — stop Windows from tracking you
- **Network Manager** — block unknown devices from your Wi-Fi

### 🌐 Networking & Monitoring
- **Speed Test** — test your internet speed
- **Wi-Fi Analyzer** — scan & inspect nearby networks
- **Ping Monitor** — measure latency to any server
- **Network Monitor** — live connections & stats
- **System Monitor** — CPU, RAM & live performance stats
- **Temperature Monitor** — keep an eye on your CPU/GPU temps
- **Process Manager** — see & control every running process
- **Service Manager** — manage Windows services
- **Disk Health** — check drive health & SMART data
- **Context Menu Manager** — clean & customize right-click menus

### 🎮 Gaming Extras
- **Game Translation** 🌍 — translate your games in real time using OCR
- **Game Settings Presets** — apply the best settings per game
- **Stutter Fix** — eliminate micro-stutters
- **Discord Rich Presence** — show CJ Optimizer on your Discord profile

---

## 📸 Screenshots

> Coming soon... stay tuned! 👀

---

## 📥 Download & Install

### Option 1: Installer (recommended)
1. Go to the **[Releases](https://github.com/ja7em505/CJ-Optimizer/releases)** page
2. Download the latest **`CJ-Optimizer-Setup-*.exe`**
3. Run the installer and follow the steps ✅
4. Launch **CJ Optimizer** from your Desktop or Start Menu

### Option 2: Auto-Update 🔄
The app supports automatic updates — new versions install themselves on quit. Always stay on the latest version!

> ⚠️ **Note:** Windows SmartScreen may show a warning because the app is not code-signed. Click **"More info" → "Run anyway"** to proceed.

---

## 📋 System Requirements

| Requirement | Minimum |
|---|---|
| 🖥️ OS | Windows 10 / 11 (64-bit) |
| 🧠 RAM | 4 GB |
| 💾 Storage | 300 MB free |
| 🌐 Internet | Required for updates & online features |

---

## 🧑‍💻 Development

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (tested on v20)
- npm

### Setup
```bash
# 1️⃣ Clone the repository
git clone https://github.com/ja7em505/CJ-Optimizer.git
cd CJ-Optimizer

# 2️⃣ Install dependencies
npm install

# 3️⃣ Run in development mode
npm run dev
```

### Build the installer
```bash
# Windows NSIS installer
npm run build

# Unpacked app (portable folder)
npm run pack
```

---

## 📁 Project Structure

```
CJ-Optimizer/
├── src/
│   ├── main/          # 🧠 Electron main process & services
│   ├── preload/       # 🔗 Preload scripts (IPC bridge)
│   └── renderer/      # 🎨 UI (HTML/CSS/JS)
├── scripts/           # ⚙️ Build utilities
├── assets/            # 🖼️ Icons & resources
├── dist/              # 📦 Build output
└── package.json
```

---

## 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop framework
- **[electron-builder](https://www.electron.build/)** — Installer & packaging
- **[electron-updater](https://www.electron.build/auto-update)** — Auto-updates
- **[systeminformation](https://www.npmjs.com/package/systeminformation)** — Hardware monitoring
- **[tesseract.js](https://tesseract.projectnaptha.com/)** — OCR for game translation
- **[discord-rpc](https://www.npmjs.com/package/discord-rpc)** — Discord Rich Presence

---

## 🙏 Support

- ⭐ Star this repo if you find it useful!
- 🐛 Found a bug? [Open an issue](https://github.com/ja7em505/CJ-Optimizer/issues)
- 💬 Have a feature request? We'd love to hear it!

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Made with ❤️ by [CJ](https://github.com/ja7em505)**

*Game on, lag off!* 🎮⚡

</div>
