const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");

function fileStatus(filename) {
  const p = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(p)) return `❌ غير موجود`;
    const stat = fs.statSync(p);
    const raw = fs.readFileSync(p, "utf8");
    let count = "?";
    try { const arr = JSON.parse(raw); count = Array.isArray(arr) ? arr.length : Object.keys(arr).length; } catch {}
    const ageMin = Math.floor((Date.now() - stat.mtimeMs) / 60000);
    const sizeKB = (stat.size / 1024).toFixed(1);
    return `✅ ${count} كوكي | ${sizeKB}KB | ${ageMin}د مضى`;
  } catch {
    return `⚠️ خطأ في القراءة`;
  }
}

module.exports = {
  name: "حسابات",
  aliases: ["accounts", "cookies_status"],
  description: "حالة ملفات الكوكيز والاعتمادات",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const files = [
      ["appstate.json", "الحساب الرئيسي"],
      ["alt.json", "الحساب الاحتياطي"],
    ];
    const lines = [
      "📋 حالة الحسابات",
      "━━━━━━━━━━━━━",
    ];
    for (const [file, label] of files) {
      lines.push(`${label}:\n   ${fileStatus(file)}`);
    }
    lines.push("━━━━━━━━━━━━━");
    lines.push(`🕐 الوقت الحالي: ${new Date().toLocaleString("ar-SA")}`);
    api.sendMessage(lines.join("\n"), threadID);
  }
};
