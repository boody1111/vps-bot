const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const FILE = path.join(DATA_DIR, "divel.json");

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
  return {};
}
function save(d) { try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch {} }
if (!global.divelMonitor) global.divelMonitor = {};

function resetTimer(api, threadID, cfg) {
  if (cfg._timer) clearTimeout(cfg._timer);
  cfg._timer = setTimeout(() => {
    if (!cfg.enabled || cfg.botSentLast) return;
    api.sendMessage(cfg.message, threadID);
    cfg.botSentLast = true;
  }, cfg.timeMs);
}

module.exports = {
  name: "دايفل",
  aliases: ["divel", "activity_monitor", "نشاط"],
  description: "مراقب النشاط — يرسل رسالة عند صمت المجموعة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const d = load();
    if (!global.divelMonitor[threadID]) {
      global.divelMonitor[threadID] = {
        enabled: false, message: "👋 هل من أحد هنا؟", timeMs: 5 * 60 * 1000, botSentLast: true
      };
    }
    const cfg = global.divelMonitor[threadID];
    const sub = args[0];

    if (sub === "on" || sub === "تفعيل") {
      cfg.enabled = true;
      cfg.botSentLast = false;
      d[threadID] = { enabled: true, message: cfg.message, timeMs: cfg.timeMs };
      save(d);
      resetTimer(api, threadID, cfg);
      return api.sendMessage(`✅ تم تفعيل مراقب النشاط. سيرسل رسالة بعد ${cfg.timeMs / 60000} دقيقة من الصمت.`, threadID);
    }
    if (sub === "off" || sub === "ايقاف") {
      cfg.enabled = false;
      if (cfg._timer) { clearTimeout(cfg._timer); cfg._timer = null; }
      d[threadID] = { enabled: false, message: cfg.message, timeMs: cfg.timeMs };
      save(d);
      return api.sendMessage("❌ تم إيقاف مراقب النشاط.", threadID);
    }
    if (sub === "رسالة" || sub === "change") {
      const msg = args.slice(1).join(" ");
      if (!msg) return api.sendMessage("⚠️ اكتب الرسالة.", threadID);
      cfg.message = msg;
      d[threadID] = { ...d[threadID], message: msg };
      save(d);
      return api.sendMessage(`✅ الرسالة: ${msg}`, threadID);
    }
    if (sub === "وقت" || sub === "time") {
      const mins = parseInt(args[1]);
      if (!mins || mins < 1) return api.sendMessage("⚠️ اكتب عدد الدقائق.", threadID);
      cfg.timeMs = mins * 60 * 1000;
      save(d);
      return api.sendMessage(`✅ وقت الصمت: ${mins} دقيقة.`, threadID);
    }

    api.sendMessage(
      `👁 مراقب النشاط\n━━━━━━━━━━━━━\n` +
      `الحالة: ${cfg.enabled ? "✅ نشط" : "❌ موقوف"}\n` +
      `الرسالة: ${cfg.message}\n` +
      `وقت الصمت: ${cfg.timeMs / 60000} دقيقة\n\n` +
      `الأوامر: دايفل تفعيل | ايقاف | رسالة [نص] | وقت [دقائق]`,
      threadID
    );
  }
};
