import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

const BOT_DIR =
  process.env.BOT_DIR ?? path.resolve(process.cwd(), "../../bot");

function botFile(name: string) {
  return path.join(BOT_DIR, name);
}

function readJSON(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// GET /api/bot/status
router.get("/bot/status", (req, res): void => {
  const state = readJSON(botFile("runtime-state.json"));
  if (!state) {
    res.json({
      running: false,
      startedAt: null,
      account: null,
      accountId: null,
      region: null,
      protections: {
        cookieRenewal: { nextFireAt: null },
        siteVisit: { nextFireAt: null },
        ping: { nextFireAt: null },
        graphqlVisit: { nextFireAt: null },
      },
      botState: { locked: false, nameLock: { active: false } },
      modules: { nameLock: { active: false }, schedulers: {}, nicknames: {} },
      lastUpdated: null,
    });
    return;
  }
  res.json(state);
});

// GET /api/bot/logs
router.get("/bot/logs", (req, res) => {
  const logs = readJSON(botFile("runtime-logs.json"));
  res.json({ logs: logs || [] });
});

// GET /api/bot/settings
router.get("/bot/settings", (req, res): void => {
  const settings = readJSON(botFile("settings.json"));
  if (!settings) {
    res.status(404).json({ error: "Settings not found" });
    return;
  }
  res.json(settings);
});

// POST /api/bot/settings
router.post("/bot/settings", (req, res) => {
  try {
    const current = readJSON(botFile("settings.json")) || {};
    const updated = { ...current, ...req.body };
    if (updated.admins && Array.isArray(updated.admins)) {
      updated.admins = updated.admins.map(String);
    }
    writeJSON(botFile("settings.json"), updated);
    res.json({ success: true, settings: updated });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to update settings", details: String(e) });
  }
});

// POST /api/bot/reconnect
router.post("/bot/reconnect", (req, res) => {
  try {
    writeJSON(botFile("reconnect-signal.json"), { requestedAt: Date.now() });
    res.json({ success: true, message: "Reconnect signal sent to bot." });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to send reconnect signal", details: String(e) });
  }
});

// GET /api/bot/modules
router.get("/bot/modules", (req, res) => {
  const state = readJSON(botFile("runtime-state.json"));
  const modules = state?.modules || {};
  res.json({
    nameLock: modules.nameLock || { active: false, name: null, threadId: null },
    schedulers: modules.schedulers || {},
    nicknames: modules.nicknames || {},
  });
});

// GET /api/bot/sys-stats — live CPU & RAM snapshot
router.get("/bot/sys-stats", (_req, res) => {
  const os = require("os");
  const cpus = os.cpus();
  const totalTicks = cpus.reduce(
    (acc: number, cpu: { times: Record<string, number> }) =>
      acc + Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0),
    0
  );
  const idleTicks = cpus.reduce(
    (acc: number, cpu: { times: { idle: number } }) => acc + cpu.times.idle,
    0
  );
  const cpuPct = totalTicks > 0 ? Math.round((1 - idleTicks / totalTicks) * 100) : 0;
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMB   = Math.round((totalMem - freeMem) / 1024 / 1024);
  const totalMB  = Math.round(totalMem / 1024 / 1024);
  res.json({ cpu: cpuPct, ramMB: usedMB, totalRamMB: totalMB });
});

// POST /api/bot/modules/stop
router.post("/bot/modules/stop", (req, res): void => {
  const { type, threadID } = req.body as { type?: string; threadID?: string };
  const valid = ["nm_stop", "hook_stop", "hook2_stop", "nicknames_stop"];
  if (!type || !valid.includes(type)) {
    res.status(400).json({ error: `Invalid type. Must be one of: ${valid.join(", ")}` });
    return;
  }
  try {
    const queuePath = botFile("module-commands.json");
    const existing: unknown[] = readJSON(queuePath) || [];
    existing.push({ type, threadID: threadID || null, requestedAt: Date.now() });
    writeJSON(queuePath, existing);
    res.json({ success: true, queued: { type, threadID: threadID || null } });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to queue command", details: String(e) });
  }
});

// POST /api/bot/modules/start — queue a module start command
// Body: { type: "hook_start"|"nm_start"|"nicknames_start", threadID, ...config }
router.post("/bot/modules/start", (req, res): void => {
  const body = req.body as {
    type?: string;
    threadID?: string;
    message?: string;
    intervalMs?: number;
    minIntervalMs?: number;
    maxIntervalMs?: number;
    name?: string;
    nickname?: string;
  };

  const { type, threadID } = body;
  const valid = ["hook_start", "hook2_start", "nm_start", "nicknames_start"];

  if (!type || !valid.includes(type)) {
    res.status(400).json({ error: `Invalid type. Must be one of: ${valid.join(", ")}` });
    return;
  }
  if (!threadID) {
    res.status(400).json({ error: "threadID is required" });
    return;
  }

  try {
    const queuePath = botFile("module-commands.json");
    const existing: unknown[] = readJSON(queuePath) || [];
    existing.push({ ...body, requestedAt: Date.now() });
    writeJSON(queuePath, existing);
    res.json({ success: true, queued: body });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to queue start command", details: String(e) });
  }
});

// GET /api/bot/cookies — download current appstate.json
router.get("/bot/cookies", (req, res): void => {
  const appstatePath = botFile("appstate.json");
  try {
    const raw = fs.readFileSync(appstatePath, "utf8");
    const data = JSON.parse(raw);
    res.json({ appstate: data, count: Array.isArray(data) ? data.length : 0 });
  } catch {
    res.status(404).json({ error: "appstate.json not found or invalid" });
  }
});

// POST /api/bot/cookies — upload new appstate.json
// Body: { appstate: [...] }
router.post("/bot/cookies", (req, res): void => {
  const { appstate } = req.body as { appstate?: unknown };
  if (!appstate || !Array.isArray(appstate) || appstate.length === 0) {
    res.status(400).json({ error: "appstate must be a non-empty array" });
    return;
  }
  try {
    writeJSON(botFile("appstate.json"), appstate);
    writeJSON(botFile("alt.json"), appstate);
    writeJSON(botFile("reconnect-signal.json"), { requestedAt: Date.now(), reason: "cookies_updated" });
    res.json({ success: true, count: appstate.length, message: "Cookies uploaded. Bot will reconnect." });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to write cookies", details: String(e) });
  }
});

// POST /api/bot/send — send a message to any group from the panel
router.post("/bot/send", (req, res): void => {
  const { threadID, message } = req.body as { threadID?: string; message?: string };
  if (!threadID || !message) {
    res.status(400).json({ error: "threadID and message are required" });
    return;
  }
  try {
    const queuePath = botFile("module-commands.json");
    const existing: unknown[] = readJSON(queuePath) || [];
    existing.push({ type: "send_message", threadID, message, requestedAt: Date.now() });
    writeJSON(queuePath, existing);
    res.json({ success: true, queued: { threadID, message } });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to queue message", details: String(e) });
  }
});

// POST /api/bot/broadcast — send a message to ALL active threads at once
router.post("/bot/broadcast", (req, res): void => {
  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const activity = readJSON(botFile("thread-activity.json")) || {};
    const threadIDs = Object.keys(activity);
    if (threadIDs.length === 0) {
      res.status(400).json({ error: "No active threads found" });
      return;
    }
    const queuePath = botFile("module-commands.json");
    const existing: unknown[] = readJSON(queuePath) || [];
    const ts = Date.now();
    for (const threadID of threadIDs) {
      existing.push({ type: "send_message", threadID, message, requestedAt: ts });
    }
    writeJSON(queuePath, existing);
    res.json({ success: true, queued: threadIDs.length, threadIDs });
  } catch (e: unknown) {
    res.status(500).json({ error: "Failed to queue broadcast", details: String(e) });
  }
});

// GET /api/bot/thread-activity — real-time group activity heatmap (24-hour buckets)
router.get("/bot/thread-activity", (req, res) => {
  const filePath = botFile("thread-activity.json");
  const data = readJSON(filePath);
  if (!data) {
    res.json({ heatmap: {}, updatedAt: null });
    return;
  }
  // Normalize: ensure all values are arrays of 24 numbers
  const heatmap: Record<string, number[]> = {};
  for (const [tid, hours] of Object.entries(data)) {
    if (Array.isArray(hours) && hours.length === 24) {
      heatmap[tid] = (hours as number[]).map(Number);
    }
  }
  let updatedAt: number | null = null;
  try { updatedAt = require("fs").statSync(filePath).mtimeMs; } catch {}
  res.json({ heatmap, updatedAt });
});

export default router;
