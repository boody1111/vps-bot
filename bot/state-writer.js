const fs = require("fs");
const path = require("path");

// DATA_DIR: persistent files go to BOT_DIR (Railway volume) when set.
const DATA_DIR = process.env.BOT_DIR || __dirname;
const STATE_PATH = path.join(DATA_DIR, "runtime-state.json");
const LOGS_PATH = path.join(DATA_DIR, "runtime-logs.json");

const MAX_LOGS = 200;
const runtimeLogs = [];

const runtimeState = {
  running: false,
  startedAt: null,
  account: null,
  accountId: null,
  region: null,
  protections: {
    cookieRenewal: { nextInMs: null, nextFireAt: null },
    siteVisit: { nextInMs: null, nextFireAt: null },
    ping: { nextInMs: null, nextFireAt: null },
    graphqlVisit: { nextInMs: null, nextFireAt: null },
  },
  botState: {
    locked: false,
    nameLock: { active: false, name: null, threadId: null },
  },
  modules: {
    nameLock: { active: false, name: null, threadId: null },
    schedulers: {},
    nicknames: {},
  },
  lastUpdated: null,
};

function saveState() {
  try {
    runtimeState.lastUpdated = Date.now();
    fs.writeFileSync(STATE_PATH, JSON.stringify(runtimeState, null, 2), "utf8");
  } catch {
    // Silently fail state writes
  }
}

function saveLogs() {
  try {
    fs.writeFileSync(LOGS_PATH, JSON.stringify(runtimeLogs, null, 2), "utf8");
  } catch {}
}

function addLog(level, message) {
  const entry = { time: Date.now(), level, message: String(message) };
  runtimeLogs.push(entry);
  if (runtimeLogs.length > MAX_LOGS) runtimeLogs.splice(0, runtimeLogs.length - MAX_LOGS);
  saveLogs();
}

function setAccount(accountId, accountName, region) {
  runtimeState.account = accountName;
  runtimeState.accountId = accountId;
  runtimeState.region = region;
  runtimeState.running = true;
  runtimeState.startedAt = Date.now();
  saveState();
}

function setProtectionTimer(type, nextInMs) {
  if (!runtimeState.protections[type]) return;
  runtimeState.protections[type].nextInMs = nextInMs;
  runtimeState.protections[type].nextFireAt = Date.now() + nextInMs;
  saveState();
}

function setBotState(botState) {
  runtimeState.botState = {
    locked: botState.locked || false,
    nameLock: {
      active: (botState.nameLock || {}).active || false,
      name: (botState.nameLock || {}).name || null,
      threadId: (botState.nameLock || {}).threadId || null,
    },
  };
  saveState();
}

// Serializes in-memory scheduler + scheduler2 + nicknames state (strips non-JSON timerId refs)
function setModuleState(botState) {
  const schedulers = {};
  for (const [tid, sched] of Object.entries(botState.scheduler || {})) {
    schedulers[tid] = {
      active: sched.active || false,
      message: sched.message || null,
      intervalMs: sched.intervalMs || null,
    };
  }

  const schedulers2 = {};
  for (const [tid, s2] of Object.entries(botState.scheduler2 || {})) {
    schedulers2[tid] = {
      active: s2.active || false,
      message: s2.message || null,
      minMs: s2.minMs || null,
      maxMs: s2.maxMs || null,
      activeWindowMs: s2.activeWindowMs || null,
    };
  }

  const nicknames = {};
  for (const [tid, nick] of Object.entries(botState.nicknames || {})) {
    nicknames[tid] = {
      active: nick.active || false,
      nickname: nick.nickname || null,
      intervalMs: nick.intervalMs || null,
      participantCount: (nick.participants || []).length,
    };
  }

  runtimeState.modules = {
    nameLock: {
      active: (botState.nameLock || {}).active || false,
      name: (botState.nameLock || {}).name || null,
      threadId: (botState.nameLock || {}).threadId || null,
    },
    schedulers,
    schedulers2,
    nicknames,
  };
  saveState();
}

// Intercept console to capture logs
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;

console.log = (...args) => {
  const msg = args.join(" ");
  origLog(...args);
  addLog("INFO", msg);
};

console.error = (...args) => {
  const msg = args.join(" ");
  origError(...args);
  addLog("ERROR", msg);
};

console.warn = (...args) => {
  const msg = args.join(" ");
  origWarn(...args);
  addLog("WARN", msg);
};

// Write initial state
saveState();
saveLogs();

module.exports = { setAccount, setProtectionTimer, setBotState, setModuleState, addLog, runtimeState };
