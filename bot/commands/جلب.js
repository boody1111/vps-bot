module.exports = {
  name: "جلب",
  aliases: ["threadid", "tid", "groupid"],
  description: "عرض معرف المحادثة الحالية",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID, isGroup } = event;
    api.sendMessage(
      `📋 معلومات المحادثة\n━━━━━━━━━━━━━\n` +
      `💬 معرف المحادثة: ${threadID}\n` +
      `👤 معرفك: ${senderID}\n` +
      `🏷️ النوع: ${isGroup ? "مجموعة" : "محادثة فردية"}`,
      threadID
    );
  }
};
