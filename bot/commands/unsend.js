module.exports = {
  name: "unsend",
  aliases: ["سحب", "delete_msg", "احذف"],
  description: "سحب رسالة البوت الأخيرة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    if (!messageReply) return api.sendMessage("⚠️ رد على رسالة البوت لسحبها.", threadID);
    api.unsendMessage(messageReply.messageID, err => {
      if (err) api.sendMessage("❌ لا يمكن سحب هذه الرسالة.", threadID);
    });
  }
};
