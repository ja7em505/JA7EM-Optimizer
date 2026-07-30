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

async function getProcesses(sortBy = 'cpu') {
  const processes = [];
  try {
    const prop = sortBy === 'cpu' ? 'CPU' : sortBy === 'memory' ? 'WorkingSet64' : 'Name';
    const output = await runPs(`powershell -Command "Get-Process | Sort-Object -Property ${prop} -Descending | Select-Object -First 100 Id,ProcessName,CPU,@{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}},@{N='Handles';E={$_.HandleCount}},@{N='Threads';E={$_.Threads.Count}} | ConvertTo-Json"`);
    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    for (const proc of arr) {
      processes.push({
        pid: proc.Id,
        name: proc.ProcessName,
        cpu: proc.CPU ? Math.round(proc.CPU * 100) / 100 : 0,
        memory: proc.MemoryMB || 0,
        handles: proc.Handles || 0,
        threads: proc.Threads || 0
      });
    }
  } catch (e) { }
  return processes;
}

async function killProcess(pid) {
  try {
    await runFire(`taskkill /F /PID ${pid}`);
    return { status: 'success', message: `تم إنهاء العملية ${pid}` };
  } catch (e) {
    return { status: 'failed', message: `فشل إنهاء العملية: ${e.message}` };
  }
}

async function killProcessByName(name) {
  try {
    await runFire(`taskkill /F /IM "${name}"`);
    return { status: 'success', message: `تم إنهاء ${name}` };
  } catch (e) {
    return { status: 'failed', message: `فشل إنهاء ${name}: ${e.message}` };
  }
}

async function getProcessDetails(pid) {
  try {
    const output = await runPs(`powershell -Command "Get-Process -Id ${pid} | Select-Object Id,ProcessName,CPU,@{N='MemoryMB';E={[math]::Round($_.WorkingSet64/1MB,1)}},@{N='MemoryGB';E={[math]::Round($_.WorkingSet64/1GB,2)}},StartTime,@{N='Path';E={$_.Path}},@{N='MainWindowTitle';E={$_.MainWindowTitle}} | ConvertTo-Json"`);
    return JSON.parse(output);
  } catch (e) {
    return null;
  }
}

async function setProcessPriority(pid, priority) {
  try {
    const prioMap = {
      'realtime': 'RealTime', 'high': 'High', 'above': 'AboveNormal',
      'normal': 'Normal', 'below': 'BelowNormal', 'low': 'Idle'
    };
    const prio = prioMap[priority] || 'Normal';
    await runFire(`powershell -Command "(Get-Process -Id ${pid}).PriorityClass = '${prio}'"`);
    return { status: 'success', message: `تم تغيير الأولوية إلى ${prio}` };
  } catch (e) {
    return { status: 'failed', message: `فشل: ${e.message}` };
  }
}

async function getProcessStats() {
  try {
    const output = await runPs('powershell -Command "$procs = Get-Process; $totalMem = ($procs | Measure-Object WorkingSet64 -Sum).Sum; $totalCpu = ($procs | Measure-Object CPU -Sum).Sum; @{ TotalProcesses = $procs.Count; TotalMemoryMB = [math]::Round($totalMem/1MB,0); TotalCPU = [math]::Round($totalCpu,1) } | ConvertTo-Json"');
    return JSON.parse(output);
  } catch (e) {
    return { TotalProcesses: 0, TotalMemoryMB: 0, TotalCPU: 0 };
  }
}

module.exports = { getProcesses, killProcess, killProcessByName, getProcessDetails, setProcessPriority, getProcessStats };
