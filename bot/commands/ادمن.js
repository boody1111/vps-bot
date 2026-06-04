const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.BOT_DIR || path.join(__dirname, "..");
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    return { prefix: "/", admins: [], botName: "Bot" };
  }
}

function saveSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  name: "ادمن",
  description: "إدارة قائمة المشرفين (إضافة / حذف / عرض)",
  usage: "ادمن قائمة | ادمن اضافة [ID] | ادمن حذف [ID]",
  adminOnly: true,

  execute(api, event, args, settings) {
    const sub = args[0];
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!sub || sub === "قائمة") {
      const current = loadSettings();
      const admins = current.admins || [];
      if (admins.length === 0) {
        return api.sendMessage("📋 لا يوجد مشرفون مسجلون حالياً.", threadID, null, messageID);
      }
      let msg = `👑 قائمة المشرفين (${admins.length}):\n`;
      msg += "━".repeat(28) + "\n";
      admins.forEach((id, i) => {
        msg += `${i + 1}. ${id}\n`;
      });
      return api.sendMessage(msg, threadID, null, messageID);
    }

    if (sub === "اضافة") {
      const targetId = String(args[1] || "").trim();
      if (!targetId || !/^\d+$/.test(targetId)) {
        return api.sendMessage("⚠️ يرجى تحديد معرّف Facebook صحيح (أرقام فقط).", threadID, null, messageID);
      }
      const current = loadSettings();
      const admins = current.admins || [];
      if (admins.includes(targetId)) {
        return api.sendMessage(`ℹ️ المعرّف ${targetId} مشرف مسبقاً.`, threadID, null, messageID);
      }
      admins.push(targetId);
      saveSettings({ ...current, admins });
      return api.sendMessage(`✅ تمت إضافة ${targetId} كمشرف.`, threadID, null, messageID);
    }

    if (sub === "حذف") {
      const targetId = String(args[1] || "").trim();
      if (!targetId || !/^\d+$/.test(targetId)) {
        return api.sendMessage("⚠️ يرجى تحديد معرّف Facebook صحيح (أرقام فقط).", threadID, null, messageID);
      }
      const current = loadSettings();
      const admins = (current.admins || []).filter((id) => id !== targetId);
      if (admins.length === (current.admins || []).length) {
        return api.sendMessage(`ℹ️ المعرّف ${targetId} غير موجود في قائمة المشرفين.`, threadID, null, messageID);
      }
      saveSettings({ ...current, admins });
      return api.sendMessage(`🗑️ تمت إزالة ${targetId} من قائمة المشرفين.`, threadID, null, messageID);
    }

    const prefix = settings.prefix || "/";
    api.sendMessage(
      `❓ استخدام غير صحيح.\n\nالاستخدامات:\n${prefix}ادمن قائمة\n${prefix}ادمن اضافة [ID]\n${prefix}ادمن حذف [ID]`,
      threadID,
      null,
      messageID
    );
  },
};
