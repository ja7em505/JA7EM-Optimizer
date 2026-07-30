const { desktopCapturer, screen, BrowserWindow } = require('electron');
const path = require('path');

let overlayWindow = null;
let captureInterval = null;
let isTranslating = false;
let lastTranslatedText = '';
let translationHistory = [];
let settings = {
  mode: 'region',
  region: { x: 0, y: 0, width: 400, height: 200 },
  screenIndex: 0,
  interval: 2500,
  sourceLang: 'en',
  targetLang: 'ar'
};

async function captureRegion(region) {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (!sources || sources.length === 0) return null;

    const source = sources[settings.screenIndex] || sources[0];
    const thumbnail = source.thumbnail;

    if (!thumbnail || thumbnail.isEmpty()) return null;

    const imgSize = thumbnail.getSize();

    const cropX = Math.max(0, Math.min(region.x, imgSize.width - 1));
    const cropY = Math.max(0, Math.min(region.y, imgSize.height - 1));
    const cropW = Math.min(region.width, imgSize.width - cropX);
    const cropH = Math.min(region.height, imgSize.height - cropY);

    if (cropW <= 10 || cropH <= 10) return null;

    const cropped = thumbnail.crop({
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH)
    });

    return cropped.toDataURL();
  } catch (err) {
    console.error('Screen capture error:', err.message);
    return null;
  }
}

async function captureFullScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (!sources || sources.length === 0) return null;

    const source = sources[settings.screenIndex] || sources[0];
    const thumbnail = source.thumbnail;

    if (!thumbnail || thumbnail.isEmpty()) return null;

    return thumbnail.toDataURL();
  } catch (err) {
    console.error('Full screen capture error:', err.message);
    return null;
  }
}

async function ocrWithAPI(imageDataUrl) {
  try {
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': 'K85588334388957' 
      },
      body: `base64Image=data:image/png;base64,${base64Data}&language=eng&isOverlayRequired=false&OCREngine=2`
    });

    if (!response.ok) throw new Error(`OCR API error: ${response.status}`);

    const data = await response.json();

    if (data && data.ParsedResults && data.ParsedResults.length > 0) {
      const text = data.ParsedResults[0].ParsedText;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }

    if (data && data.IsErroredOnProcessing) {
      console.error('OCR processing error:', data.ErrorMessage);
    }

    return '';
  } catch (err) {
    console.error('OCR API error:', err.message);
    return '';
  }
}

async function translateText(text, from, to) {
  if (!text || text.length < 2) return '';

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encoded}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0]
        .filter(item => item && item[0])
        .map(item => item[0])
        .join('');
      if (translated.length > 0) return translated;
    }

    throw new Error('Empty translation result');
  } catch (err) {
    console.error('Google Translate error:', err.message);
  }

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      const t = data.responseData.translatedText;
      if (t && t !== text && t.length > 0) return t;
    }
  } catch (err2) {
    console.error('MyMemory error:', err2.message);
  }

  try {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.menti.ai/translate?text=${encoded}&source_lang=${from}&target_lang=${to}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.translated_text) return data.translated_text;
  } catch (err3) {
    console.error('Menti translate error:', err3.message);
  }

  return `[ترجمة غير متوفرة] ${text}`;
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

    if (!imageData) {
      sendToRenderer({
        original: '',
        translated: '',
        error: 'لا يمكن التقاط الشاشة — تأكد إن اللعبة شغالة'
      });
      return;
    }

    const ocrText = await ocrWithAPI(imageData);

    if (!ocrText || ocrText.length < 2) {
      sendToRenderer({
        original: '',
        translated: '',
        imageData
      });
      return;
    }

    const cleanText = ocrText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanText === lastTranslatedText) {
      return;
    }

    lastTranslatedText = cleanText;

    const translated = await translateText(cleanText, settings.sourceLang, settings.targetLang);

    const result = {
      original: cleanText,
      translated,
      imageData
    };

    sendToRenderer(result);

    translationHistory.unshift({
      original: cleanText.substring(0, 200),
      translated: translated.substring(0, 200),
      time: new Date().toLocaleTimeString('ar')
    });

    if (translationHistory.length > 50) {
      translationHistory = translationHistory.slice(0, 50);
    }

  } catch (err) {
    console.error('Process capture error:', err.message);
    sendToRenderer({
      original: '',
      translated: '',
      error: `خطأ: ${err.message}`
    });
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

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 450,
    height: 250,
    x: screenWidth - 470,
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

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function closeOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
    overlayWindow = null;
  }
}

function startTranslation(customSettings) {
  if (customSettings) {
    settings = { ...settings, ...customSettings };
  }

  isTranslating = true;
  lastTranslatedText = '';

  if (captureInterval) clearInterval(captureInterval);

  processCapture();
  captureInterval = setInterval(processCapture, settings.interval);

  return { status: 'started', settings };
}

function stopTranslation() {
  isTranslating = false;
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  lastTranslatedText = '';
  return { status: 'stopped' };
}

function getAvailableScreens() {
  return new Promise(async (resolve) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 100, height: 100 }
      });

      const screens = sources.map((s, i) => ({
        id: s.id,
        name: s.name,
        index: i,
        width: s.thumbnail.getSize().width,
        height: s.thumbnail.getSize().height
      }));

      resolve(screens);
    } catch (err) {
      resolve([{ id: 'primary', name: 'الشاشة الرئيسية', index: 0, width: 1920, height: 1080 }]);
    }
  });
}

function getSettings() { return settings; }
function updateSettings(newSettings) { settings = { ...settings, ...newSettings }; return settings; }
function getHistory() { return translationHistory; }

module.exports = {
  createOverlayWindow,
  closeOverlayWindow,
  startTranslation,
  stopTranslation,
  getAvailableScreens,
  getSettings,
  updateSettings,
  processCapture,
  captureRegion,
  captureFullScreen,
  getHistory
};
