const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");

function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8")); } catch { return { admins: [] }; }
}
function saveSettings(s) {
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2)); } catch {}
}

module.exports = {
  name: "admins",
  aliases: ["ادمن", "مشرفي_البوت"],
  description: "إدارة مشرفي البوت — إضافة، حذف، قائمة",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID, mentions, messageReply } = event;
    const sub = args[0];
    const s = loadSettings();
    if (!s.admins) s.admins = [];

    if (!sub || sub === "قائمة" || sub === "list") {
      if (!s.admins.length) return api.sendMessage("👥 لا يوجد مشرفون مضافون.", threadID);
      const lines = await Promise.all(s.admins.map(async id => {
        try { const info = await api.getUserInfo(id); return `• ${info?.[id]?.name || id} (${id})`; }
        catch { return `• ${id}`; }
      }));
      return api.sendMessage(`👥 مشرفو البوت (${s.admins.length}):\n${lines.join("\n")}`, threadID);
    }

    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID || args[1];
    if (!targetID) return api.sendMessage("⚠️ الاستخدام:\n• admins إضافة @مستخدم\n• admins حذف @مستخدم\n• admins قائمة", threadID);

    if (sub === "إضافة" || sub === "add") {
      if (s.admins.includes(targetID)) return api.sendMessage("⚠️ هذا المستخدم مشرف بالفعل.", threadID);
      s.admins.push(targetID);
      saveSettings(s);
      return api.sendMessage(`✅ تمت إضافة ${targetID} كمشرف للبوت.`, threadID);
    }
    if (sub === "حذف" || sub === "remove" || sub === "del") {
      s.admins = s.admins.filter(id => id !== targetID);
      saveSettings(s);
      return api.sendMessage(`✅ تمت إزالة ${targetID} من مشرفي البوت.`, threadID);
    }

    api.sendMessage("⚠️ الاستخدام:\n• admins إضافة @مستخدم\n• admins حذف @مستخدم\n• admins قائمة", threadID);
  }
};
