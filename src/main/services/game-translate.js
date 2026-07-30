const { exec } = require('child_process');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

const TRANSLATION_API = 'https://translate.googleapis.com/translate_a/single';

async function translateText(text, from = 'en', to = 'ar') {
  try {
    const url = `${TRANSLATION_API}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await runPs(
      `powershell -Command "(Invoke-WebRequest -Uri '${url}').Content"`,
      10000
    );

    const data = JSON.parse(response);
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (error) {
    return text;
  }
}

async function translateGameText(texts, from = 'en', to = 'ar') {
  const results = [];

  for (const text of texts) {
    const translated = await translateText(text, from, to);
    results.push({
      original: text,
      translated: translated
    });
  }

  return results;
}

module.exports = { translateText, translateGameText };
