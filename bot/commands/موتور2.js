const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const FILE = path.join(DATA_DIR, "motor2Data.json");

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
  return {};
}
function save(d) { try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch {} }
if (!global.motorData2) global.motorData2 = load();
if (!global.lastActivity) global.lastActivity = {};

function startLoop(api, threadID, row) {
  if (row._interval) { try { clearInterval(row._interval); } catch {} }
  const ms = (row.time || 30) * 60 * 1000;
  row._interval = setInterval(() => {
    if (!row.status || !row.message) return;
    const lastAct = global.lastActivity[threadID];
    if (!lastAct || (Date.now() - lastAct) > ms * 2) return; // only send if group is active
    api.sendMessage(row.message, threadID);
  }, ms);
}

module.exports = {
  name: "موتور2",
  aliases: ["motor2", "smartmotor"],
  description: "محرك ذكي — يرسل فقط عندما المجموعة نشطة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const d = global.motorData2;
    if (!d[threadID]) d[threadID] = { status: false, message: null, time: 30 };
    const row = d[threadID];
    const sub = args[0];

    if (sub === "تفعيل" || sub === "on") {
      if (!row.message) return api.sendMessage("⚠️ حدد رسالة أولاً: موتور2 رسالة [نص]", threadID);
      row.status = true;
      save(d);
      startLoop(api, threadID, row);
      return api.sendMessage(`✅ المحرك الذكي نشط — كل ${row.time} دقيقة (فقط عند النشاط).`, threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      row.status = false;
      if (row._interval) { clearInterval(row._interval); row._interval = null; }
      save(d);
      return api.sendMessage("❌ تم إيقاف المحرك الذكي.", threadID);
    }
    if (sub === "رسالة" || sub === "change") {
      const msg = args.slice(1).join(" ");
      if (!msg) return api.sendMessage("⚠️ اكتب الرسالة.", threadID);
      row.message = msg;
      save(d);
      return api.sendMessage(`✅ الرسالة: ${msg}`, threadID);
    }
    if (sub === "وقت" || sub === "time") {
      const mins = parseInt(args[1]);
      if (!mins || mins < 1) return api.sendMessage("⚠️ اكتب عدد الدقائق.", threadID);
      row.time = mins;
      save(d);
      if (row.status) startLoop(api, threadID, row);
      return api.sendMessage(`✅ الوقت: ${mins} دقيقة.`, threadID);
    }

    api.sendMessage(
      `⚙️ المحرك الذكي (موتور2)\n━━━━━━━━━━━━━\n` +
      `الحالة: ${row.status ? "✅ نشط" : "❌ موقوف"}\n` +
      `الرسالة: ${row.message || "—"}\n` +
      `الفترة: كل ${row.time} دقيقة (عند النشاط)\n\n` +
      `الأوامر: موتور2 تفعيل | ايقاف | رسالة [نص] | وقت [دقائق]`,
      threadID
    );
  }
};
