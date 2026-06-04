if (!global.antioutGroups) global.antioutGroups = new Set();

module.exports = {
  name: "antiout",
  aliases: ["ضد_خروج", "antileave"],
  description: "منع الأعضاء من مغادرة المجموعة — يعيدهم تلقائياً",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sub = args[0];
    if (sub === "تفعيل" || sub === "on") {
      global.antioutGroups.add(threadID);
      return api.sendMessage("🔐 تم تفعيل الحماية ضد الخروج.", threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      global.antioutGroups.delete(threadID);
      return api.sendMessage("🔓 تم إيقاف الحماية ضد الخروج.", threadID);
    }
    const active = global.antioutGroups.has(threadID);
    api.sendMessage(`🔐 الحماية ضد الخروج: ${active ? "مفعّلة ✅" : "موقوفة ❌"}\n\nالأوامر: antiout تفعيل | ايقاف`, threadID);
  }
};
