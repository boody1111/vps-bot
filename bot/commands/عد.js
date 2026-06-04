module.exports = {
  name: "عد",
  aliases: ["count", "احسب_نص"],
  description: "إحصاء الأحرف والكلمات والأحرف العربية في نص",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    const text = messageReply?.body || args.join(" ");
    if (!text) return api.sendMessage("⚠️ أرسل نصاً أو رد على رسالة.", threadID);
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const lines = text.split("\n").length;
    api.sendMessage(
      `📊 إحصاء النص:\n━━━━━━━━━━━━━\n` +
      `📝 الأحرف: ${chars}\n` +
      `🔤 الكلمات: ${words}\n` +
      `🌙 أحرف عربية: ${arabic}\n` +
      `📄 الأسطر: ${lines}`,
      threadID
    );
  }
};
