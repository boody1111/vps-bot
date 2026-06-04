module.exports = {
  name: "kick",
  aliases: ["طرد", "اخرج"],
  description: "طرد عضو من المجموعة",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID, messageReply, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID;
    if (!targetID) return api.sendMessage("⚠️ منشن العضو أو رد على رسالته.\nمثال: kick @مستخدم", threadID);
    if (targetID === senderID) return api.sendMessage("❌ لا تستطيع طرد نفسك.", threadID);
    try {
      await api.removeUserFromGroup(targetID, threadID);
      api.sendMessage(`✅ تم طرد العضو من المجموعة.`, threadID);
    } catch (e) {
      api.sendMessage(`❌ فشل الطرد: ${e.message}`, threadID);
    }
  }
};
