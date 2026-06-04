const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const BW_FILE = path.join(DATA_DIR, "badwords.json");

function loadData() {
  try { if (fs.existsSync(BW_FILE)) return JSON.parse(fs.readFileSync(BW_FILE, "utf8")); } catch {}
  return {};
}
function saveData(d) { try { fs.writeFileSync(BW_FILE, JSON.stringify(d, null, 2)); } catch {} }

module.exports = {
  name: "badwords",
  aliases: ["كلمات_سيئة", "فلتر", "filter"],
  description: "فلتر الكلمات السيئة — يطرد من يستخدمها",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const d = loadData();
    if (!d[threadID]) d[threadID] = { enabled: false, words: [] };
    const sub = args[0];

    if (sub === "تفعيل" || sub === "on") {
      d[threadID].enabled = true;
      saveData(d);
      return api.sendMessage("✅ تم تفعيل فلتر الكلمات السيئة.", threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      d[threadID].enabled = false;
      saveData(d);
      return api.sendMessage("❌ تم إيقاف فلتر الكلمات.", threadID);
    }
    if (sub === "اضافة" || sub === "add") {
      const word = args.slice(1).join(" ").trim().toLowerCase();
      if (!word) return api.sendMessage("⚠️ اكتب الكلمة بعد الأمر.", threadID);
      if (!d[threadID].words.includes(word)) { d[threadID].words.push(word); saveData(d); }
      return api.sendMessage(`✅ تمت إضافة "${word}" للفلتر.`, threadID);
    }
    if (sub === "حذف" || sub === "remove") {
      const word = args.slice(1).join(" ").trim().toLowerCase();
      d[threadID].words = d[threadID].words.filter(w => w !== word);
      saveData(d);
      return api.sendMessage(`✅ تمت إزالة "${word}" من الفلتر.`, threadID);
    }
    if (sub === "قائمة" || sub === "list") {
      const words = d[threadID].words;
      if (!words.length) return api.sendMessage("📋 لا توجد كلمات في الفلتر.", threadID);
      return api.sendMessage(`📋 الكلمات المحظورة (${words.length}):\n${words.join("، ")}`, threadID);
    }

    const active = d[threadID].enabled;
    const count = d[threadID].words.length;
    api.sendMessage(
      `🛡 فلتر الكلمات\n━━━━━━━━━━━━━\n` +
      `الحالة: ${active ? "مفعّل ✅" : "موقوف ❌"}\n` +
      `الكلمات: ${count}\n\n` +
      `الأوامر: تفعيل | ايقاف | اضافة [كلمة] | حذف [كلمة] | قائمة`,
      threadID
    );
  }
};
