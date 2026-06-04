const fs = require("fs");
const path = require("path");

// SETTINGS_PATH reads from BOT_DIR (Railway volume) when set; commands always
// live next to this file in the source directory.
const DATA_DIR = process.env.BOT_DIR || __dirname;
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const COMMANDS_DIR = path.join(__dirname, "commands");

// Shared bot state accessible by all commands
const state = {
  locked: false,
  nameLock: {
    active: false,
    name: null,
    threadId: null,
  },
  scheduler: {},
  scheduler2: {},
  nicknames: {},
};

// ─── Protection 10: Raid / Burst guard ───────────────────────────────────────
// Tracks non-admin command counts per thread in the last 30 seconds
const BURST_WINDOW_MS = 30 * 1000;
const BURST_LIMIT = 15;
const threadBurstMap = new Map(); // threadID → [timestamps]

function checkBurst(threadID) {
  const now = Date.now();
  const times = (threadBurstMap.get(threadID) || []).filter(
    (t) => now - t < BURST_WINDOW_MS
  );
  times.push(now);
  threadBurstMap.set(threadID, times);
  return times.length > BURST_LIMIT;
}

// ─── Protection 11: Error budget per command ─────────────────────────────────
// Auto-disables a command for 1 hour if it errors > 5 times in 10 min
const ERROR_WINDOW_MS = 10 * 60 * 1000;
const ERROR_LIMIT = 5;
const DISABLE_DURATION_MS = 60 * 60 * 1000;
const commandErrors = new Map(); // commandName → [timestamps]
const commandDisabled = new Map(); // commandName → disabledUntil (epoch ms)

function recordCommandError(commandName) {
  const now = Date.now();
  const times = (commandErrors.get(commandName) || []).filter(
    (t) => now - t < ERROR_WINDOW_MS
  );
  times.push(now);
  commandErrors.set(commandName, times);

  if (times.length >= ERROR_LIMIT) {
    const until = now + DISABLE_DURATION_MS;
    commandDisabled.set(commandName, until);
    console.warn(
      `[PROTECTION-11] Command "${commandName}" disabled for 1h — ${times.length} errors in last 10 min.`
    );
    commandErrors.delete(commandName);
  }
}

function isCommandDisabled(commandName) {
  const until = commandDisabled.get(commandName);
  if (!until) return false;
  if (Date.now() > until) {
    commandDisabled.delete(commandName);
    console.log(`[PROTECTION-11] Command "${commandName}" re-enabled after 1h cooldown.`);
    return false;
  }
  return true;
}

// ─── Load all commands ────────────────────────────────────────────────────────
const commands = new Map();

function loadCommands() {
  const files = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    try {
      const cmd = require(path.join(COMMANDS_DIR, file));
      if (cmd.name) {
        commands.set(cmd.name, cmd);
        if (cmd.aliases && Array.isArray(cmd.aliases)) {
          for (const alias of cmd.aliases) {
            commands.set(alias, cmd);
          }
        }
      }
    } catch (e) {
      console.error(`[HANDLER] Failed to load command ${file}:`, e.message);
    }
  }
  console.log(`[HANDLER] Loaded ${commands.size} command entries from ${files.length} files.`);
}

// Export registerReplyHandler early so commands can import it during loadCommands()
// without hitting the circular-dependency incomplete-exports race.
// (registerReplyHandler is a function declaration — it is hoisted.)
module.exports.registerReplyHandler = registerReplyHandler;

loadCommands();

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    return { prefix: "/", admins: [], botName: "Bot" };
  }
}

function isAdmin(senderId, settings) {
  return (settings.admins || []).includes(String(senderId));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Protection 4: Typing indicators to simulate human behavior
function sendTypingIndicator(api, threadID) {
  const delay = randomInt(500, 3000);
  setTimeout(() => {
    try {
      api.sendTypingIndicator(threadID, () => {});
    } catch {}
  }, delay);
}

// ─── Global reply-handler registry ───────────────────────────────────────────
// Games and interactive commands register handlers here.
// Key: `${threadID}:${senderID}` — single-user handler
// Key: `${threadID}:*`           — any-user in thread (2-player games)
// Value: { handler(api, event, settings, state), expires, persist }
//   persist=true → handler stays after first call (multi-round games manage their own removal)
if (!global.nexusReplyHandlers) global.nexusReplyHandlers = new Map();

function checkReplyHandlers(api, event, settings) {
  if (!global.nexusReplyHandlers || global.nexusReplyHandlers.size === 0) return false;
  const { threadID, senderID } = event;
  const now = Date.now();

  // Exact match first
  const exactKey = `${threadID}:${senderID}`;
  if (global.nexusReplyHandlers.has(exactKey)) {
    const rh = global.nexusReplyHandlers.get(exactKey);
    if (now > rh.expires) { global.nexusReplyHandlers.delete(exactKey); return false; }
    if (!rh.persist) global.nexusReplyHandlers.delete(exactKey);
    try { rh.handler(api, event, settings, state); } catch(e) { console.error('[REPLY-HANDLER]', e.message); }
    return true;
  }

  // Wildcard thread match (any sender)
  const wildKey = `${threadID}:*`;
  if (global.nexusReplyHandlers.has(wildKey)) {
    const rh = global.nexusReplyHandlers.get(wildKey);
    if (now > rh.expires) { global.nexusReplyHandlers.delete(wildKey); return false; }
    if (!rh.persist) global.nexusReplyHandlers.delete(wildKey);
    try { rh.handler(api, event, settings, state); } catch(e) { console.error('[REPLY-HANDLER]', e.message); }
    return true;
  }

  return false;
}

// Convenience helper exposed to commands
function registerReplyHandler(threadID, senderID, handler, ttlMs = 120000, persist = false) {
  const key = `${threadID}:${senderID === '*' ? '*' : senderID}`;
  global.nexusReplyHandlers.set(key, { handler, expires: Date.now() + ttlMs, persist });
}

function handle(api, event, settings) {
  const { senderID, threadID, body } = event;

  if (!body) return;

  const admin = isAdmin(senderID, settings);

  // ── Check reply handlers BEFORE prefix/lock checks ──────────────────────
  // This allows games to work without the bot prefix.
  if (checkReplyHandlers(api, event, settings)) return;

  // Check bot lock — only admins pass through
  if (state.locked && !admin) return;

  // Silent mode — bot ignores all commands in this thread
  if (state.silentMode?.[threadID] && !admin) return;

  const prefix = settings.prefix || "/";

  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift();

  if (!commands.has(commandName)) return;

  const cmd = commands.get(commandName);

  // Protection 10: Raid / Burst guard — auto-lock if non-admins spam
  if (!admin) {
    if (checkBurst(threadID)) {
      if (!state.locked) {
        state.locked = true;
        console.warn(
          `[PROTECTION-10] Raid guard triggered in thread ${threadID} — bot locked.`
        );
        api.sendMessage(
          "🔒 تم قفل البوت تلقائياً بسبب كثرة الأوامر. يرجى مراجعة المشرف.",
          threadID
        );
      }
      return;
    }
  }

  // Protection 11: Error budget — skip if command is temporarily disabled
  if (isCommandDisabled(commandName)) {
    api.sendMessage(
      `⚠️ الأمر "${commandName}" معطّل مؤقتاً بسبب أخطاء متكررة. سيعود خلال ساعة.`,
      threadID
    );
    return;
  }

  // Typing indicator before responding (Protection 4)
  sendTypingIndicator(api, threadID);

  // Admin-only guard
  if (cmd.adminOnly && !admin) {
    setTimeout(() => {
      api.sendMessage("⛔ هذا الأمر للمشرفين فقط.", threadID);
    }, randomInt(600, 2000));
    return;
  }

  // ─── Protection: Command Sandbox — catch errors and track budget ──────────
  try {
    const replyDelay = randomInt(700, 2500);
    setTimeout(() => {
      try {
        cmd.execute(api, event, args, settings, state);
      } catch (e) {
        console.error(`[HANDLER] Command "${commandName}" threw at execute:`, e.message);
        recordCommandError(commandName);
      }
    }, replyDelay);
  } catch (e) {
    console.error(`[HANDLER] Command ${commandName} setup error:`, e.message);
    recordCommandError(commandName);
  }
}

/**
 * دالة معالجة الأحداث المعدلة
 * تمت إزالة رسالة "تم استعادة اسم المجموعة" منها
 */
function handleEvent(api, event, settings) {
  // Name lock: watch for thread name changes
  if (event.logMessageType === "log:thread-name" && state.nameLock.active) {
    if (state.nameLock.threadId && event.threadID !== state.nameLock.threadId) return;

    // سيقوم البوت بإعادة الاسم بصمت دون إرسال رسالة
    setTimeout(() => {
      api.setTitle(state.nameLock.name, event.threadID, (err) => {
        if (err) {
          console.error(`[NAME-LOCK] Failed to revert name: ${err.message}`);
        }
      });
    }, randomInt(800, 2000));
  }
}

module.exports = { handle, handleEvent, state, commands, registerReplyHandler };
