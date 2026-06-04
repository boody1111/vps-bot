module.exports = {
  name: "تثبيت",
  aliases: ["pin", "pinmsg", "ثبّت"],
  description: "تثبيت رسالة في المجموعة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    if (!messageReply) return api.sendMessage("⚠️ رد على الرسالة التي تريد تثبيتها.", threadID);
    if (typeof api.pinMessage !== "function") {
      return api.sendMessage("⚠️ تثبيت الرسائل غير مدعوم في هذا الإصدار.", threadID);
    }
    api.pinMessage(messageReply.messageID, threadID, err => {
      if (err) return api.sendMessage(`❌ فشل التثبيت: ${err.message}`, threadID);
      api.sendMessage("📌 تم تثبيت الرسالة.", threadID);
    });
  }
};
