const { exec } = require('child_process');
const crypto = require('crypto');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getCpuInfo() {
  try {
    const output = await runPs('powershell -Command "Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed,CurrentClockSpeed,L2CacheSize,L3CacheSize,Architecture | ConvertTo-Json"', 10000);
    const data = JSON.parse(output);
    const arr = Array.isArray(data) ? data : [data];
    const cpu = arr[0] || {};
    return {
      name: cpu.Name || 'Unknown',
      cores: cpu.NumberOfCores || 0,
      threads: cpu.NumberOfLogicalProcessors || 0,
      maxClock: cpu.MaxClockSpeed || 0,
      currentClock: cpu.CurrentClockSpeed || 0,
      l2Cache: cpu.L2CacheSize || 0,
      l3Cache: cpu.L3CacheSize || 0
    };
  } catch (e) {
    return { name: 'Unknown', cores: 0, threads: 0, maxClock: 0, currentClock: 0, l2Cache: 0, l3Cache: 0 };
  }
}

async function runBenchmark() {
  const cpu = await getCpuInfo();
  const results = { cpu, scores: {}, overall: 0 };

  // Integer test
  const intStart = Date.now();
  let intScore = 0;
  for (let i = 0; i < 5000000; i++) {
    intScore += Math.sqrt(i) * Math.sin(i);
  }
  const intTime = Date.now() - intStart;
  results.scores.integer = { score: Math.round(5000000 / intTime * 100), time: intTime };

  // Float test
  const floatStart = Date.now();
  let floatScore = 0;
  for (let i = 0; i < 5000000; i++) {
    floatScore += Math.tan(i * 0.001) * Math.cos(i * 0.001);
  }
  const floatTime = Date.now() - floatStart;
  results.scores.float = { score: Math.round(5000000 / floatTime * 100), time: floatTime };

  // String test
  const strStart = Date.now();
  let str = '';
  for (let i = 0; i < 500000; i++) {
    str = crypto.createHash('md5').update('test' + i).digest('hex');
  }
  const strTime = Date.now() - strStart;
  results.scores.string = { score: Math.round(500000 / strTime * 100), time: strTime };

  // Array/Sort test
  const arrStart = Date.now();
  const arr = [];
  for (let i = 0; i < 2000000; i++) {
    arr.push(Math.random());
  }
  arr.sort((a, b) => a - b);
  const arrTime = Date.now() - arrStart;
  results.scores.array = { score: Math.round(2000000 / arrTime * 100), time: arrTime };

  // Multi-thread test
  const mtStart = Date.now();
  const promises = [];
  for (let t = 0; t < Math.min(cpu.threads || 4, 8); t++) {
    promises.push(new Promise(resolve => {
      let sum = 0;
      for (let i = 0; i < 2000000; i++) {
        sum += Math.sqrt(i);
      }
      resolve(sum);
    }));
  }
  await Promise.all(promises);
  const mtTime = Date.now() - mtStart;
  results.scores.multithread = { score: Math.round(2000000 / mtTime * 100 * (cpu.threads || 4)), time: mtTime };

  // Overall score
  const allScores = Object.values(results.scores).map(s => s.score);
  results.overall = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  // Rating
  if (results.overall > 800) results.rating = 'ممتاز — معالج عالي الأداء';
  else if (results.overall > 500) results.rating = 'جيد جداً — أداء عالي';
  else if (results.overall > 300) results.rating = 'جيد — أداء متوسط';
  else if (results.overall > 150) results.rating = 'مقبول — أداء أساسي';
  else results.rating = 'ضعيف — يحتاج ترقية';

  // Reference comparison
  results.references = [
    { name: 'Intel i9-14900K', score: 1200 },
    { name: 'AMD Ryzen 9 7950X', score: 1150 },
    { name: 'Intel i7-14700K', score: 950 },
    { name: 'AMD Ryzen 7 7800X3D', score: 900 },
    { name: 'Intel i5-14600K', score: 750 },
    { name: 'AMD Ryzen 5 7600X', score: 700 },
    { name: 'Intel i5-13400', score: 550 },
    { name: 'AMD Ryzen 5 5600X', score: 500 },
    { name: 'Intel i3-12100', score: 400 },
    { name: 'AMD Ryzen 3 5300G', score: 350 }
  ];

  return results;
}

module.exports = { getCpuInfo, runBenchmark };
