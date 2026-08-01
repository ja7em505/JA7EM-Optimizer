<div align="center">

# ðŸš€ CJ Optimizer

**The All-in-One PC Gaming Optimizer â€” Boost FPS, Clean Your System, Repair & Monitor Everything**

![Version](https://img.shields.io/badge/version-1.1.6-5865F2)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-00A4EF)
![Electron](https://img.shields.io/badge/Electron-37-green)
![License](https://img.shields.io/badge/license-MIT-blue)

> âš¡ One tool. Every tweak. Maximum performance. ðŸŽ®

</div>

---

## ðŸ“– About

**CJ Optimizer** is a powerful, all-in-one optimization suite for Windows built with Electron. It gives gamers and everyday users everything they need to **boost FPS**, **clean up junk**, **repair Windows**, and **monitor system health** â€” all from one beautiful, easy-to-use interface.

No more jumping between 10 different tools. Everything is here. ðŸ› ï¸

---

## âœ¨ Key Features

### âš¡ Performance & FPS
- **FPS Boost** â€” one-click registry & process tweaks for higher FPS
- **Game Mode** â€” focus all system resources on your game
- **Auto Memory Cleaner** â€” automatically keeps your RAM free
- **RAM Optimizer** â€” manual memory cleanup on demand
- **FPS Overlay** â€” see your FPS in-game, in real time
- **Game FPS Profiles** â€” save & load per-game performance profiles
- **GPU Optimizer** â€” tune your graphics card for gaming
- **CPU Benchmark** â€” test your processor's power
- **SSD Optimizer** â€” tweaks to keep your SSD fast
- **Power Plans** â€” create the perfect gaming power plan
- **Visual Effects** â€” optimize Windows visuals for speed
- **Input Lag Fixer** â€” reduce input delay in games
- **Mouse Latency** â€” minimize mouse click/response lag

### ðŸ§¹ System Cleanup
- **System Cleaner** â€” remove junk, temp files & leftovers
- **Browser Cleanup** â€” clear cache from all major browsers
- **Duplicate Finder** â€” find & remove duplicate files
- **Disk Analyzer** â€” see what's eating your storage
- **Bloatware Remover** â€” uninstall unwanted pre-installed apps
- **Startup Manager** â€” control what runs at boot
- **App Uninstaller** â€” cleanly remove installed programs
- **Windows Apps Uninstaller** â€” remove Store & provisioned apps

### ðŸ› ï¸ System Repair
- **Windows Repair** â€” SFC, DISM, registry & DLL fixes
- **Internet Repair** â€” reset TCP/IP, Winsock, DNS & firewall
- **Network Optimizer** â€” DNS, QoS & TCP tweaks for lower ping
- **Network Turbo** â€” maximum network throughput
- **Windows Update Blocker** â€” take control of updates
- **BSOD Analyzer** â€” read & understand blue screen crashes
- **Restore Points** â€” create & restore system backups

### ðŸ›¡ï¸ Security & Privacy
- **Defender Manager** â€” full control over Windows Defender
- **Privacy Tweaks** â€” stop Windows from tracking you
- **Network Manager** â€” block unknown devices from your Wi-Fi

### ðŸŒ Networking & Monitoring
- **Speed Test** â€” test your internet speed
- **Wi-Fi Analyzer** â€” scan & inspect nearby networks
- **Ping Monitor** â€” measure latency to any server
- **Network Monitor** â€” live connections & stats
- **System Monitor** â€” CPU, RAM & live performance stats
- **Temperature Monitor** â€” keep an eye on your CPU/GPU temps
- **Process Manager** â€” see & control every running process
- **Service Manager** â€” manage Windows services
- **Disk Health** â€” check drive health & SMART data
- **Context Menu Manager** â€” clean & customize right-click menus

### ðŸŽ® Gaming Extras
- **Game Translation** ðŸŒ â€” translate your games in real time using OCR
- **Game Settings Presets** â€” apply the best settings per game
- **Stutter Fix** â€” eliminate micro-stutters
- **Discord Rich Presence** â€” show CJ Optimizer on your Discord profile

---

## ðŸ“¸ Screenshots

> Coming soon... stay tuned! ðŸ‘€

---

## ðŸ“¥ Download & Install

### Option 1: Installer (recommended)
1. Go to the **[Releases](https://github.com/CJ505/CJ-Optimizer/releases)** page
2. Download the latest **`CJ-Optimizer-Setup-*.exe`**
3. Run the installer and follow the steps âœ…
4. Launch **CJ Optimizer** from your Desktop or Start Menu

### Option 2: Auto-Update ðŸ”„
The app supports automatic updates â€” new versions install themselves on quit. Always stay on the latest version!

> âš ï¸ **Note:** Windows SmartScreen may show a warning because the app is not code-signed. Click **"More info" â†’ "Run anyway"** to proceed.

---

## ðŸ“‹ System Requirements

| Requirement | Minimum |
|---|---|
| ðŸ–¥ï¸ OS | Windows 10 / 11 (64-bit) |
| ðŸ§  RAM | 4 GB |
| ðŸ’¾ Storage | 300 MB free |
| ðŸŒ Internet | Required for updates & online features |

---

## ðŸ§‘â€ðŸ’» Development

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (tested on v20)
- npm

### Setup
```bash
# 1ï¸âƒ£ Clone the repository
git clone https://github.com/CJ505/CJ-Optimizer.git
cd CJ-Optimizer

# 2ï¸âƒ£ Install dependencies
npm install

# 3ï¸âƒ£ Run in development mode
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

## ðŸ“ Project Structure

```
CJ-Optimizer/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main/          # ðŸ§  Electron main process & services
â”‚   â”œâ”€â”€ preload/       # ðŸ”— Preload scripts (IPC bridge)
â”‚   â””â”€â”€ renderer/      # ðŸŽ¨ UI (HTML/CSS/JS)
â”œâ”€â”€ scripts/           # âš™ï¸ Build utilities
â”œâ”€â”€ assets/            # ðŸ–¼ï¸ Icons & resources
â”œâ”€â”€ dist/              # ðŸ“¦ Build output
â””â”€â”€ package.json
```

---

## ðŸ› ï¸ Built With

- **[Electron](https://www.electronjs.org/)** â€” Cross-platform desktop framework
- **[electron-builder](https://www.electron.build/)** â€” Installer & packaging
- **[electron-updater](https://www.electron.build/auto-update)** â€” Auto-updates
- **[systeminformation](https://www.npmjs.com/package/systeminformation)** â€” Hardware monitoring
- **[tesseract.js](https://tesseract.projectnaptha.com/)** â€” OCR for game translation
- **[discord-rpc](https://www.npmjs.com/package/discord-rpc)** â€” Discord Rich Presence

---

## ðŸ™ Support

- â­ Star this repo if you find it useful!
- ðŸ› Found a bug? [Open an issue](https://github.com/CJ505/CJ-Optimizer/issues)
- ðŸ’¬ Have a feature request? We'd love to hear it!

---

## ðŸ“„ License

This project is licensed under the **MIT License**.

---

<div align="center">

**Made with â¤ï¸ by [CJ](https://github.com/CJ505)**

*Game on, lag off!* ðŸŽ®âš¡

</div>
