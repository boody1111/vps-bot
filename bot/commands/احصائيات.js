const os = require("os");
const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}ي ${h%24}س ${m%60}د`;
  if (h > 0) return `${h}س ${m%60}د`;
  if (m > 0) return `${m}د ${s%60}ث`;
  return `${s}ث`;
}

function fmtMem(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  return (bytes / 1048576).toFixed(0) + " MB";
}

function cookieInfo(file) {
  try {
    const p = path.isAbsolute(file) ? file : path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return { exists: false };
    const raw = fs.readFileSync(p, "utf8");
    const arr = JSON.parse(raw);
    const count = Array.isArray(arr) ? arr.length : 0;
    const stat = fs.statSync(p);
    const ageMin = Math.floor((Date.now() - stat.mtimeMs) / 60000);
    return { exists: true, count, ageMin };
  } catch { return { exists: true, count: "?", ageMin: "?" }; }
}

module.exports = {
  name: "احصائيات",
  aliases: ["stats", "systems", "انظمة", "sysinfo"],
  description: "إحصائيات شاملة لجميع أنظمة البوت",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const mem = process.memoryUsage();
    const cpus = os.cpus();
    const heapPct = Math.round(mem.heapUsed / mem.heapTotal * 100);

    const mainCookie = cookieInfo("appstate.json");
    const altCookie = cookieInfo("alt.json");

    const schedulerCount = Object.keys(state.scheduler || {}).length;
    const scheduler2Count = Object.keys(state.scheduler2 || {}).length;
    const nicknameCount = Object.keys(state.nicknames || {}).length;
    const replyHandlers = global.nexusReplyHandlers?.size || 0;
    const motorCount = Object.keys(global.motorData || {}).filter(k => global.motorData[k]?.status).length;
    const motor2Count = Object.keys(global.motorData2 || {}).filter(k => global.motorData2[k]?.status).length;

    const lines = [
      "📊 إحصائيات النظام الكاملة",
      "━━━━━━━━━━━━━━━━━━━━━━━",
      `⏱  مدة التشغيل   : ${fmtUptime(process.uptime() * 1000)}`,
      `⚙️  Node.js        : ${process.version} | PID ${process.pid}`,
      `💻 المعالج        : ${cpus[0]?.model?.slice(0, 30) || "—"} (${cpus.length} أنوية)`,
      "",
      "🔐 الكوكيز",
      "━━━━━━━━━━━━━",
      `📄 appstate.json : ${mainCookie.exists ? `✅ ${mainCookie.count} كوكي (آخر تحديث: ${mainCookie.ageMin}د)` : "❌ غير موجود"}`,
      `📄 alt.json      : ${altCookie.exists ? `✅ ${altCookie.count} كوكي (آخر تحديث: ${altCookie.ageMin}د)` : "❌ غير موجود"}`,
      "",
      "💾 الذاكرة",
      "━━━━━━━━━━━━━",
      `📦 Heap: ${fmtMem(mem.heapUsed)} / ${fmtMem(mem.heapTotal)} (${heapPct}%)`,
      `📦 RSS: ${fmtMem(mem.rss)}`,
      `📦 External: ${fmtMem(mem.external)}`,
      "",
      "🤖 الأنظمة النشطة",
      "━━━━━━━━━━━━━",
      `🔒 البوت مقفل     : ${state.locked ? "نعم 🔴" : "لا 🟢"}`,
      `📌 قفل الاسم       : ${state.nameLock?.active ? `✅ (${state.nameLock.name})` : "❌"}`,
      `⚙️  المحركات (1)   : ${motorCount} نشط`,
      `⚙️  المحركات (2)   : ${motor2Count} نشط`,
      `📅 جدول1           : ${schedulerCount} مجموعة`,
      `📅 جدول2           : ${scheduler2Count} مجموعة`,
      `🎭 الكنيات         : ${nicknameCount} مجموعة`,
      `🎮 انتظار الرد     : ${replyHandlers} معالج`,
      "",
      "🛡️ الحمايات (P1-P18) نشطة ✅",
    ];

    api.sendMessage(lines.join("\n"), threadID);
  }
};
