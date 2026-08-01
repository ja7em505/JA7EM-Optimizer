const { exec } = require('child_process');
const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(null); } });
    }).on('error', reject);
  });
}

const translationCache = new Map();

async function translateSingle(text, from = 'en', to = 'ar') {
  if (!text || text.length < 2) return text;
  const cacheKey = `${from}|${to}|${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const data = await httpGet(url);
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].filter(item => item && item[0]).map(item => item[0]).join('').trim();
      if (translated && translated !== text) {
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

  return text;
}

async function translateText(text, from = 'en', to = 'ar') {
  return await translateSingle(text, from, to);
}

async function translateGameText(texts, from = 'en', to = 'ar') {
  const results = await Promise.all(texts.map(async (text) => {
    const translated = await translateSingle(text, from, to);
    return { original: text, translated };
  }));
  return results;
}

module.exports = { translateText, translateGameText };
