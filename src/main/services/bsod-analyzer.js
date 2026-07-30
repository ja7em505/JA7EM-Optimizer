const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function runPs(cmd, timeout = 15000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf8', timeout }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

async function getBSODReports() {
  const reports = [];

  try {
    const output = await runPs('powershell -Command "Get-EventLog -LogName System -Source \'Microsoft-Windows-WER-SystemErrorReporting\' -Newest 10 -ErrorAction SilentlyContinue | Select-Object TimeGenerated,Message | ConvertTo-Json"', 15000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of arr) {
      const msg = entry.Message || '';
      const codeMatch = msg.match(/BugcheckCode\s+([^\r\n]+)/);
      const paramMatch = msg.match(/Parameter 1\s+([^\r\n]+)/);
      reports.push({
        date: entry.TimeGenerated,
        bugcheckCode: codeMatch ? codeMatch[1].trim() : 'N/A',
        parameter1: paramMatch ? paramMatch[1].trim() : 'N/A',
        description: getBugcheckDescription(codeMatch ? codeMatch[1].trim() : '')
      });
    }
  } catch (e) { }

  try {
    const minidumpDir = 'C:\\Windows\\Minidump';
    if (fs.existsSync(minidumpDir)) {
      const files = fs.readdirSync(minidumpDir).filter(f => f.endsWith('.dmp'));
      for (const file of files.slice(-10)) {
        const stats = fs.statSync(path.join(minidumpDir, file));
        if (!reports.find(r => r.date === stats.mtime)) {
          reports.push({
            date: stats.mtime,
            fileName: file,
            size: Math.round(stats.size / 1024) + ' KB',
            description: 'ملف Minidump'
          });
        }
      }
    }
  } catch (e) { }

  try {
    const output = await runPs('powershell -Command "Get-WinEvent -FilterHashtable @{LogName=\'System\';Id=1001;ProviderName=\'Microsoft-Windows-WER-SystemErrorReporting\'} -MaxEvents 10 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Message | ConvertTo-Json"', 15000);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of arr) {
      const msg = entry.Message || '';
      const codeMatch = msg.match(/BugcheckCode\s+(0x[0-9a-fA-F]+|\d+)/);
      if (codeMatch && !reports.find(r => r.date === entry.TimeCreated)) {
        reports.push({
          date: entry.TimeCreated,
          bugcheckCode: codeMatch[1],
          description: getBugcheckDescription(codeMatch[1])
        });
      }
    }
  } catch (e) { }

  reports.sort((a, b) => new Date(b.date) - new Date(a.date));

  return reports;
}

function getBugcheckDescription(code) {
  const codes = {
    '0x0000007E': 'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
    '0x0000007B': 'INACCESSIBLE_BOOT_DEVICE',
    '0x00000050': 'PAGE_FAULT_IN_NONPAGED_AREA',
    '0x0000000A': 'IRQL_NOT_LESS_OR_EQUAL',
    '0x0000001E': 'KMODE_EXCEPTION_NOT_HANDLED',
    '0x000000D1': 'DRIVER_IRQL_NOT_LESS_OR_EQUAL',
    '0x000000C2': 'BAD_POOL_CALLER',
    '0x00000019': 'BAD_POOL_HEADER',
    '0x00000024': 'NTFS_FILE_SYSTEM',
    '0x0000002E': 'DATA_BUS_ERROR',
    '0x0000004E': 'PFN_LIST_CORRUPT',
    '0x0000007F': 'UNEXPECTED_KERNEL_MODE_TRAP',
    '0x0000009C': 'MACHINE_CHECK_EXCEPTION',
    '0x000000EA': 'THREAD_STUCK_IN_DEVICE_DRIVER',
    '0x000000F4': 'CRITICAL_OBJECT_TERMINATION',
    '0x000000FE': 'HAL_INITIALIZATION_FAILED',
    '0x00000116': 'VIDEO_TDR_FAILURE',
    '0x00000124': 'WHEA_UNCORRECTABLE_ERROR',
    '0x00000133': 'DPC_WATCHDOG_VIOLATION',
    '0x00000154': 'UNEXPECTED_STORE_EXCEPTION',
    '0x000000BE': 'ATTEMPTED_WRITE_TO_READONLY_MEMORY'
  };
  return codes[code] || 'Unknown Error Code: ' + code;
}

async function analyzeMinidump(fileName) {
  try {
    const dumpPath = `C:\\Windows\\Minidump\\${fileName}`;
    if (!fs.existsSync(dumpPath)) {
      return { status: 'failed', message: 'الملف غير موجود' };
    }

    const output = await runPs(`powershell -Command "$h = @{}; $h.FileName = '${dumpPath}'; Get-WinEvent -FilterHashtable @{LogName='System';Id=1001} -MaxEvents 50 -ErrorAction SilentlyContinue | Where-Object { $_.Message -like '*${fileName.replace('.dmp','')}*' } | Select-Object TimeCreated,Message | ConvertTo-Json"`, 15000);

    return { status: 'success', fileName, analysis: output || 'لا توجد تفاصيل إضافية' };
  } catch (e) {
    return { status: 'failed', message: `فشل التحليل: ${e.message}` };
  }
}

module.exports = { getBSODReports, analyzeMinidump, getBugcheckDescription };
