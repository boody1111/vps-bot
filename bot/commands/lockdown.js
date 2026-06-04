const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");

if (!global.lockdownGroups) global.lockdownGroups = new Set();

module.exports = {
  name: "lockdown",
  aliases: ["قفل_مجموعة", "lockdown_mode"],
  description: "تفعيل وضع الإغلاق — إعادة إضافة من يغادر",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sub = args[0];
    if (sub === "تفعيل" || sub === "on") {
      global.lockdownGroups.add(threadID);
      return api.sendMessage("🔒 تم تفعيل وضع الإغلاق — سيتم إعادة إضافة من يغادر المجموعة.", threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      global.lockdownGroups.delete(threadID);
      return api.sendMessage("🔓 تم إيقاف وضع الإغلاق.", threadID);
    }
    const active = global.lockdownGroups.has(threadID);
    api.sendMessage(`🔒 وضع الإغلاق: ${active ? "مفعّل ✅" : "موقوف ❌"}\n\nالاستخدام:\n• lockdown تفعيل\n• lockdown ايقاف`, threadID);
  }
};
