if (!global.nicknameProtect) global.nicknameProtect = new Map();

module.exports = {
  name: "حماية",
  aliases: ["protect_nicks", "nickname_guard", "حماية_كنيات"],
  description: "حماية الكنيات — يمنع تغييرها",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sub = args[0];

    if (sub === "تفعيل" || sub === "on") {
      global.nicknameProtect.set(threadID, { enabled: true, nicknames: {} });
      return api.sendMessage("🛡 تم تفعيل حماية الكنيات.", threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      global.nicknameProtect.delete(threadID);
      return api.sendMessage("🔓 تم إيقاف حماية الكنيات.", threadID);
    }
    if (sub === "تحديث" || sub === "sync") {
      const protect = global.nicknameProtect.get(threadID);
      if (!protect) return api.sendMessage("⚠️ فعّل الحماية أولاً.", threadID);
      api.getThreadInfo(threadID, (err, info) => {
        if (err) return api.sendMessage("❌ فشل جلب معلومات المجموعة.", threadID);
        const nicknames = info.nicknames || {};
        protect.nicknames = { ...nicknames };
        api.sendMessage(`✅ تم تحديث سجل الكنيات (${Object.keys(nicknames).length} كنية).`, threadID);
      });
      return;
    }

    const active = global.nicknameProtect.has(threadID);
    api.sendMessage(
      `🛡 حماية الكنيات: ${active ? "✅ مفعّلة" : "❌ موقوفة"}\n\n` +
      `الأوامر: حماية تفعيل | ايقاف | تحديث`,
      threadID
    );
  }
};
