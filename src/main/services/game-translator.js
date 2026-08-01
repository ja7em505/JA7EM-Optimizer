const { desktopCapturer, screen, BrowserWindow } = require('electron');
const path = require('path');
const https = require('https');

let overlayWindow = null;
let captureInterval = null;
let isTranslating = false;
let lastTranslatedText = '';
let translationHistory = [];
const translationCache = new Map();
let settings = {
  mode: 'region',
  region: { x: 0, y: 0, width: 400, height: 200 },
  screenIndex: 0,
  interval: 2000,
  sourceLang: 'en',
  targetLang: 'ar'
};

const OCR_API_KEY = process.env.OCR_API_KEY || 'K85588334388957';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(null); } });
    }).on('error', reject);
  });
}

function httpPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function captureRegion(region) {
  try {
    const primary = screen.getPrimaryDisplay();
    const { width: sw, height: sh } = primary.size;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.min(sw, 2560), height: Math.min(sh, 1440) }
    });
    if (!sources || sources.length === 0) return null;
    const source = sources[settings.screenIndex] || sources[0];
    const thumbnail = source.thumbnail;
    if (!thumbnail || thumbnail.isEmpty()) return null;
    const imgSize = thumbnail.getSize();
    const scaleX = imgSize.width / sw;
    const scaleY = imgSize.height / sh;
    const cropX = Math.max(0, Math.round(region.x * scaleX));
    const cropY = Math.max(0, Math.round(region.y * scaleY));
    const cropW = Math.round(region.width * scaleX);
    const cropH = Math.round(region.height * scaleY);
    if (cropW < 10 || cropH < 10) return null;
    const cropped = thumbnail.crop({ x: cropX, y: cropY, width: cropW, height: cropH });
    return cropped.toDataURL();
  } catch (e) { return null; }
}

async function captureFullScreen() {
  try {
    const primary = screen.getPrimaryDisplay();
    const { width: sw, height: sh } = primary.size;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.min(sw, 2560), height: Math.min(sh, 1440) }
    });
    if (!sources || sources.length === 0) return null;
    const source = sources[settings.screenIndex] || sources[0];
    const thumbnail = source.thumbnail;
    if (!thumbnail || thumbnail.isEmpty()) return null;
    return thumbnail.toDataURL();
  } catch (e) { return null; }
}

const OCR_LANG_MAP = { en: 'eng', ja: 'jpn', ko: 'kor', zh: 'chs', fr: 'fre', de: 'ger', es: 'spa', ru: 'rus', ar: 'ara' };

async function ocrWithAPI(imageDataUrl) {
  try {
    if (!OCR_API_KEY) return '';
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const ocrLang = OCR_LANG_MAP[settings.sourceLang] || 'eng';
    const body = new URLSearchParams({
      apikey: OCR_API_KEY,
      base64Image: `data:image/png;base64,${base64}`,
      language: ocrLang,
      isOverlayRequired: 'false',
      OCREngine: '2'
    }).toString();

    const data = await httpPost('https://api.ocr.space/parse/image', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': OCR_API_KEY
    }, body);

    if (data && data.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;
      if (text && text.trim().length > 0) return text.trim();
    }
    return '';
  } catch (e) { return ''; }
}

async function translateText(text, from, to) {
  if (!text || text.length < 2) return '';
  const cacheKey = `${from}|${to}|${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const data = await httpGet(url);
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].filter(item => item && item[0]).map(item => item[0]).join('').trim();
      if (translated && translated.toLowerCase() !== text.toLowerCase()) {
        translationCache.set(cacheKey, translated);
        if (translationCache.size > 500) { const first = translationCache.keys().next().value; translationCache.delete(first); }
        return translated;
      }
    }
  } catch (e) {}

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const data = await httpGet(url);
    if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      const t = data.responseData.translatedText.trim();
      if (t && t.toLowerCase() !== text.toLowerCase()) {
        translationCache.set(cacheKey, t);
        return t;
      }
    }
  } catch (e) {}

  return '';
}

function textSimilarity(a, b) {
  if (!a || !b) return 0;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (shorter === 0) return longer === 0 ? 1 : 0;
  const shorterWords = new Set(shorter.split(' '));
  const longerWords = longer.split(' ');
  let match = 0;
  for (const w of longerWords) { if (shorterWords.has(w)) match++; }
  return match / longerWords.length;
}

function isDuplicate(cleanText) {
  if (!lastTranslatedText) return false;
  const similarity = textSimilarity(cleanText, lastTranslatedText);
  return similarity > 0.85 && Math.abs(cleanText.length - lastTranslatedText.length) < 10;
}

async function processCapture() {
  if (!isTranslating) return;
  try {
    let imageData;
    if (settings.mode === 'region') {
      imageData = await captureRegion(settings.region);
    } else {
      imageData = await captureFullScreen();
    }
    if (!imageData) { sendToRenderer({ original: '', translated: '' }); return; }

    const ocrText = await ocrWithAPI(imageData);
    if (!ocrText || ocrText.length < 2) { sendToRenderer({ original: '', translated: '', imageData }); return; }

    const cleanText = ocrText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    if (isDuplicate(cleanText)) return;
    lastTranslatedText = cleanText;

    const translated = await translateText(cleanText, settings.sourceLang, settings.targetLang);
    if (!translated) return;

    const result = { original: cleanText, translated, imageData };
    sendToRenderer(result);

    translationHistory.unshift({
      original: cleanText.substring(0, 200),
      translated: translated.substring(0, 200),
      time: new Date().toLocaleTimeString()
    });
    if (translationHistory.length > 50) translationHistory = translationHistory.slice(0, 50);
  } catch (e) {
    sendToRenderer({ original: '', translated: '', error: e.message });
  }
}

function sendToRenderer(data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('translator-result', data);
  }
  if (global.mainWindow && !global.mainWindow.isDestroyed()) {
    global.mainWindow.webContents.send('translator-result', data);
  }
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.focus();
    return;
  }
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  overlayWindow = new BrowserWindow({
    width: 500,
    height: 180,
    x: sw - 520,
    y: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', '..', 'preload', 'preload.js')
    }
  });
  overlayWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'overlay.html'));
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.on('closed', () => { overlayWindow = null; });
}

function closeOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
    overlayWindow = null;
  }
}

function startTranslation(customSettings) {
  if (customSettings) settings = { ...settings, ...customSettings };
  isTranslating = true;
  lastTranslatedText = '';
  if (captureInterval) clearInterval(captureInterval);
  processCapture();
  captureInterval = setInterval(processCapture, settings.interval);
  return { status: 'started', settings };
}

function stopTranslation() {
  isTranslating = false;
  if (captureInterval) { clearInterval(captureInterval); captureInterval = null; }
  lastTranslatedText = '';
  return { status: 'stopped' };
}

function getAvailableScreens() {
  return new Promise(async (resolve) => {
    try {
      const displays = screen.getAllDisplays();
      resolve(displays.map((d, i) => ({
        id: d.id.toString(),
        name: `Screen ${i + 1}`,
        index: i,
        width: d.size.width,
        height: d.size.height
      })));
    } catch (e) {
      resolve([{ id: 'primary', name: 'Main Screen', index: 0, width: 1920, height: 1080 }]);
    }
  });
}

function getSettings() { return settings; }
function updateSettings(newSettings) { settings = { ...settings, ...newSettings }; return settings; }
function getHistory() { return translationHistory; }

module.exports = {
  createOverlayWindow, closeOverlayWindow,
  startTranslation, stopTranslation,
  getAvailableScreens, getSettings, updateSettings,
  processCapture, getHistory
};
