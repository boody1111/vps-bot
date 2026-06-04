"use strict";
/**
 * Disk Guard v2 — filesystem health watchdog
 * Ported & adapted for Nexus from ZAO's diskGuard.js
 *
 * • Checks available disk space every 5 minutes using statvfs via df.
 * • Warns at 80 % usage; hard exits at 95 % to prevent data corruption.
 * • Rotates runtime-logs.json when > 2 MB.
 * • Cleans up tmp files in DATA_DIR older than 24 h.
 *
 * Exports: start(dataDir, logsPath)
 */

const fs            = require("fs");
const path          = require("path");
const { execSync }  = require("child_process");

const WARN_PCT    = 80;
const CRIT_PCT    = 95;
const CHECK_MS    = 5 * 60 * 1000;
const LOG_MAX_MB  = 2;
const TMP_MAX_AGE = 24 * 60 * 60 * 1000;

let _dataDir  = null;
let _logsPath = null;
let _warned   = false;

// ─── Disk usage ──────────────────────────────────────────────────────────────
function getDiskUsedPct(dir) {
  try {
    const out = execSync(`df -k "${dir}" 2>/dev/null | tail -1`, { timeout: 5000 }).toString().trim();
    const parts = out.split(/\s+/);
    // Output: Filesystem  1K-blocks  Used  Available  Use%  Mounted
    const usePct = parts.find((p) => p.endsWith("%"));
    if (usePct) return parseInt(usePct, 10);
    // Fallback: calculate from blocks
    const total = parseInt(parts[1], 10);
    const used  = parseInt(parts[2], 10);
    if (total && used) return Math.round((used / total) * 100);
    return 0;
  } catch {
    return 0;
  }
}

// ─── Log rotation ────────────────────────────────────────────────────────────
function rotateLogs() {
  if (!_logsPath || !fs.existsSync(_logsPath)) return;
  try {
    const stat = fs.statSync(_logsPath);
    const sizeMB = stat.size / 1024 / 1024;
    if (sizeMB > LOG_MAX_MB) {
      const raw  = fs.readFileSync(_logsPath, "utf8");
      const logs = JSON.parse(raw);
      const keep = Array.isArray(logs) ? logs.slice(-80) : [];
      fs.writeFileSync(_logsPath, JSON.stringify(keep, null, 2), "utf8");
      console.log(`[DISK-GUARD] Logs rotated (was ${sizeMB.toFixed(1)} MB → kept last 80 entries).`);
    }
  } catch {}
}

// ─── Tmp cleanup ─────────────────────────────────────────────────────────────
function cleanTmp() {
  if (!_dataDir) return;
  try {
    const entries = fs.readdirSync(_dataDir);
    const now = Date.now();
    for (const f of entries) {
      if (!f.endsWith(".tmp") && !f.endsWith(".bak")) continue;
      const fp = path.join(_dataDir, f);
      try {
        const mtime = fs.statSync(fp).mtimeMs;
        if (now - mtime > TMP_MAX_AGE) {
          fs.unlinkSync(fp);
          console.log(`[DISK-GUARD] Removed stale tmp file: ${f}`);
        }
      } catch {}
    }
  } catch {}
}

// ─── Main check cycle ────────────────────────────────────────────────────────
function runCheck() {
  const pct = getDiskUsedPct(_dataDir || "/");

  if (pct >= CRIT_PCT) {
    console.error(`[DISK-GUARD] CRITICAL: disk at ${pct}% — forcing graceful exit to prevent corruption.`);
    rotateLogs();
    setTimeout(() => process.exit(1), 2000);
    return;
  }

  if (pct >= WARN_PCT) {
    if (!_warned) {
      console.warn(`[DISK-GUARD] WARNING: disk at ${pct}% — approaching capacity.`);
      _warned = true;
    }
    // Try to free space
    cleanTmp();
    rotateLogs();
  } else {
    _warned = false;
  }
}

function start(dataDir, logsPath) {
  _dataDir  = dataDir  || "/";
  _logsPath = logsPath || null;

  runCheck();
  rotateLogs();

  setInterval(() => {
    runCheck();
    rotateLogs();
  }, CHECK_MS).unref();

  console.log(`[DISK-GUARD] Disk guard v2 active — checking every ${CHECK_MS / 60000} min.`);
}

module.exports = { start };
