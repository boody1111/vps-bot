const handler = require("./handler");
const fs = require("fs");
const path = require("path");

const SETTINGS_PATH = path.join(__dirname, "settings.json");
const DATA_DIR = process.env.BOT_DIR || __dirname;
const HEATMAP_PATH = path.join(DATA_DIR, "thread-activity.json");
const BADWORDS_PATH = path.join(DATA_DIR, "badwords.json");

function _persistHeatmap() {
  try {
    if (!global.threadActivityHeatmap) return;
    fs.writeFileSync(HEATMAP_PATH, JSON.stringify(global.threadActivityHeatmap, null, 2));
  } catch {}
}

// Load from disk on startup
try {
  if (fs.existsSync(HEATMAP_PATH)) {
    global.threadActivityHeatmap = JSON.parse(fs.readFileSync(HEATMAP_PATH, "utf8"));
    // Ensure all entries are proper arrays
    for (const tid of Object.keys(global.threadActivityHeatmap)) {
      if (!Array.isArray(global.threadActivityHeatmap[tid])) {
        global.threadActivityHeatmap[tid] = new Array(24).fill(0);
      }
    }
  }
} catch {}

// Persist heatmap to disk every 5 minutes
setInterval(_persistHeatmap, 5 * 60 * 1000);

let _bwCache = null;
let _bwCacheTime = 0;
function _loadBadwords() {
  const now = Date.now();
  if (_bwCache && now - _bwCacheTime < 30000) return _bwCache;
  try {
    if (fs.existsSync(BADWORDS_PATH)) {
      _bwCache = JSON.parse(fs.readFileSync(BADWORDS_PATH, "utf8"));
      _bwCacheTime = now;
      return _bwCache;
    }
  } catch {}
  return {};
}

function _isAdmin(senderID, settings) {
  return (settings.admins || []).includes(String(senderID));
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    return {};
  }
}

let stopListening = null;
let reconnectTimer = null;

// ─── Protection 8: MQTT-Silence ───────────────────────────────────────────────
let lastEventTime = Date.now();
let silenceWatcher = null;
const SILENCE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// ─── Protection 9: MQTT-HealthCheck — exponential backoff ────────────────────
let mqttBackoffMs = 30 * 1000; // start at 30s
const BACKOFF_MAX_MS = 5 * 60 * 1000; // cap at 5 minutes

function resetBackoff() {
  mqttBackoffMs = 30 * 1000;
}

function nextBackoff() {
  const current = mqttBackoffMs;
  mqttBackoffMs = Math.min(mqttBackoffMs * 2, BACKOFF_MAX_MS);
  return current;
}

function startSilenceWatcher(api, settings) {
  if (silenceWatcher) clearInterval(silenceWatcher);
  lastEventTime = Date.now();

  silenceWatcher = setInterval(() => {
    const silentMs = Date.now() - lastEventTime;
    if (silentMs > SILENCE_THRESHOLD_MS) {
      console.warn(
        `[PROTECTION-8] MQTT silent for ${Math.round(silentMs / 60000)} min — restarting listener.`
      );
      lastEventTime = Date.now(); // reset so we don't flood restarts
      attach(api, settings);
    }
  }, 60 * 1000); // check every minute
}

function start(api, settings) {
  api.setOptions({
    listenEvents: true,
    selfListen: false,
    online: true,
    autoMarkRead: false,
  });

  console.log("[LISTENER] Bot is now listening for messages...");
  attach(api, settings);
  startSilenceWatcher(api, settings);
}

function attach(api, settings) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (stopListening) {
    try { stopListening(); } catch {}
    stopListening = null;
  }

  try {
    stopListening = api.listen((err, event) => {
      if (err) {
        const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
        const code = err?.error || err?.res?.error;
        console.error(`[LISTENER] Error (code ${code}): ${errStr}`);

        // Fatal auth errors — do not attempt reconnect automatically
        if (
          errStr.includes("login_blocked") ||
          errStr.includes("account_inactive") ||
          errStr.includes("auth_error") ||
          errStr.includes("Blocked") ||
          code === 1357001 ||
          code === 1357004
        ) {
          console.error("[LISTENER] Fatal auth error detected — manual intervention required.");
          return;
        }

        // Code 1 = non-critical (e.g. message update), just continue
        if (code === 1) return;

        // Other errors — reconnect with exponential backoff (Protection 9)
        const backoff = nextBackoff();
        console.warn(
          `[PROTECTION-9] MQTT error — reconnecting in ${Math.round(backoff / 1000)}s (backoff: ${Math.round(mqttBackoffMs / 1000)}s next).`
        );

        reconnectTimer = setTimeout(() => {
          resetBackoff();
          attach(api, settings);
        }, backoff);
        return;
      }

      // Successful event — reset backoff + silence timer
      resetBackoff();
      lastEventTime = Date.now();

      // Update global activity trackers used by stealthEngine / mqttHealthCheck / خطاف2
      global.lastMqttActivity = Date.now();
      if (event.threadID) {
        if (!global.lastThreadActivity) global.lastThreadActivity = {};
        global.lastThreadActivity[event.threadID] = Date.now();
        // Track for motor2 smart scheduler
        if (!global.lastActivity) global.lastActivity = {};
        global.lastActivity[event.threadID] = Date.now();
      }

      const freshSettings = loadSettings();

      if (event.type === "message" || event.type === "message_reply") {
        // ── Heatmap: track hourly message counts per thread ───────────────────
        if (event.threadID) {
          if (!global.threadActivityHeatmap) global.threadActivityHeatmap = {};
          const tid = event.threadID;
          if (!global.threadActivityHeatmap[tid]) {
            global.threadActivityHeatmap[tid] = new Array(24).fill(0);
          }
          const hour = new Date().getHours();
          global.threadActivityHeatmap[tid][hour]++;
          // Persist every 20 messages to file
          const total = global.threadActivityHeatmap[tid].reduce((a, b) => a + b, 0);
          if (total % 20 === 0) _persistHeatmap();
        }

        // ── Badwords filter ───────────────────────────────────────────────────
        const bwData = _loadBadwords();
        const bwGroup = bwData[event.threadID];
        if (bwGroup?.enabled && bwGroup.words?.length && event.body) {
          const lbody = event.body.toLowerCase();
          const matched = bwGroup.words.some(w => lbody.includes(w.toLowerCase()));
          if (matched && !_isAdmin(event.senderID, freshSettings)) {
            setTimeout(() => {
              try { api.removeUserFromGroup(event.senderID, event.threadID); } catch {}
            }, 1000);
          }
        }

        handler.handle(api, event, freshSettings);
      }

      if (event.type === "event") {
        const logType = event.logMessageType;

        // ── Antiout / Lockdown: re-add users who leave ────────────────────────
        if (logType === "log:unsubscribe") {
          const lefters = event.logMessageData?.leftParticipantFbId
            ? [event.logMessageData.leftParticipantFbId]
            : (event.logMessageData?.participants || []);
          const tid = event.threadID;
          if ((global.antioutGroups?.has(tid) || global.lockdownGroups?.has(tid)) && lefters.length) {
            setTimeout(() => {
              for (const uid of lefters) {
                try { api.addUserToGroup(uid, tid); } catch {}
              }
            }, 2000);
          }
        }

        // ── Group image lock: restore if changed ──────────────────────────────
        if (logType === "log:thread-icon" && global.groupImageLock?.has(event.threadID)) {
          const imgUrl = global.groupImageLock.get(event.threadID);
          if (imgUrl) {
            setTimeout(() => {
              try { api.changeGroupImage && api.changeGroupImage(imgUrl, event.threadID); } catch {}
            }, 2000);
          }
        }

        // ── تكرار: restore group name if changed ─────────────────────────────
        if (logType === "log:thread-name" && global.repeatName) {
          const entry = global.repeatName[event.threadID];
          if (entry?.status) {
            const newName = event.logMessageData?.name || event.logMessageData?.threadName;
            if (newName && newName !== entry.name) {
              setTimeout(() => {
                try { api.setTitle(entry.name, event.threadID); } catch {}
              }, 1500);
            }
          }
        }

        // ── Divel: reset silence timer on any activity ────────────────────────
        if (global.divelMonitor?.[event.threadID]) {
          const cfg = global.divelMonitor[event.threadID];
          if (cfg.enabled) {
            cfg.botSentLast = false;
            if (cfg._timer) clearTimeout(cfg._timer);
            cfg._timer = setTimeout(() => {
              if (!cfg.enabled || cfg.botSentLast) return;
              api.sendMessage(cfg.message, event.threadID);
              cfg.botSentLast = true;
            }, cfg.timeMs);
          }
        }

        handler.handleEvent(api, event, freshSettings);
      }
    });
  } catch (e) {
    console.error("[LISTENER] attach() threw:", e.message);
    const backoff = nextBackoff();
    reconnectTimer = setTimeout(() => attach(api, settings), backoff);
  }
}

module.exports = { start };
