const { exec } = require('child_process');
const fpsBoost = require('./fps-boost');
const systemClean = require('./system-clean');
const stutterFix = require('./stutter-fix');
const ramOptimizer = require('./ram-optimizer');

async function runFullOptimization() {
  const report = {
    categories: [],
    startTime: Date.now(),
    totalFixes: 0,
    successFixes: 0,
    failedFixes: 0
  };

  // FPS Boost
  try {
    const fpsResults = await fpsBoost.applyBoost({});
    const fpsSuccess = fpsResults.filter(r => r.status === 'success').length;
    const fpsFailed = fpsResults.filter(r => r.status === 'failed').length;
    report.categories.push({
      name: 'تحسين FPS',
      icon: '🎮',
      fixes: fpsResults.length,
      success: fpsSuccess,
      failed: fpsFailed,
      items: fpsResults
    });
    report.totalFixes += fpsResults.length;
    report.successFixes += fpsSuccess;
    report.failedFixes += fpsFailed;
  } catch (e) {
    report.categories.push({ name: 'تحسين FPS', icon: '🎮', fixes: 0, success: 0, failed: 1, items: [{ name: 'خطأ عام', status: 'failed' }] });
    report.totalFixes++;
    report.failedFixes++;
  }

  // System Clean
  try {
    const cleanResults = await systemClean.cleanAll();
    const cleanSuccess = cleanResults.filter(r => r.status === 'success').length;
    const cleanFailed = cleanResults.filter(r => r.status === 'failed').length;
    report.categories.push({
      name: 'تنظيف النظام',
      icon: '🧹',
      fixes: cleanResults.length,
      success: cleanSuccess,
      failed: cleanFailed,
      items: cleanResults
    });
    report.totalFixes += cleanResults.length;
    report.successFixes += cleanSuccess;
    report.failedFixes += cleanFailed;
  } catch (e) {
    report.categories.push({ name: 'تنظيف النظام', icon: '🧹', fixes: 0, success: 0, failed: 1, items: [{ name: 'خطأ عام', status: 'failed' }] });
    report.totalFixes++;
    report.failedFixes++;
  }

  // Stutter Fix
  try {
    const stutterResults = await stutterFix.applyStutterFix({
      cpu: true, memory: true, gpu: true, storage: true,
      network: true, power: true, gameDvr: true, animations: true,
      services: true, priorities: true, timerResolution: true
    });
    const stutterSuccess = stutterResults.filter(r => r.status === 'success').length;
    const stutterFailed = stutterResults.filter(r => r.status === 'failed').length;
    report.categories.push({
      name: 'إصلاح الفريمات',
      icon: '⚡',
      fixes: stutterResults.length,
      success: stutterSuccess,
      failed: stutterFailed,
      items: stutterResults
    });
    report.totalFixes += stutterResults.length;
    report.successFixes += stutterSuccess;
    report.failedFixes += stutterFailed;
  } catch (e) {
    report.categories.push({ name: 'إصلاح الفريمات', icon: '⚡', fixes: 0, success: 0, failed: 1, items: [{ name: 'خطأ عام', status: 'failed' }] });
    report.totalFixes++;
    report.failedFixes++;
  }

  // RAM Clean
  try {
    const ramResult = await ramOptimizer.cleanRam();
    const ramItems = ramResult.results || [];
    const ramSuccess = ramItems.filter(r => r.status === 'success').length;
    const ramFailed = ramItems.filter(r => r.status === 'failed').length;
    report.categories.push({
      name: 'تحسين RAM',
      icon: '💾',
      fixes: ramItems.length,
      success: ramSuccess,
      failed: ramFailed,
      items: ramItems
    });
    report.totalFixes += ramItems.length;
    report.successFixes += ramSuccess;
    report.failedFixes += ramFailed;
  } catch (e) {
    report.categories.push({ name: 'تحسين RAM', icon: '💾', fixes: 0, success: 0, failed: 1, items: [{ name: 'خطأ عام', status: 'failed' }] });
    report.totalFixes++;
    report.failedFixes++;
  }

  report.endTime = Date.now();
  report.duration = Math.round((report.endTime - report.startTime) / 1000);

  return report;
}

module.exports = { runFullOptimization };
