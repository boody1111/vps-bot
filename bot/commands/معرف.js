module.exports = {
  name: "معرف",
  aliases: ["uid", "id", "هوية"],
  description: "عرض معرّف المستخدم أو المحادثة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});
    if (args[0] === "محادثة" || args[0] === "thread") {
      return api.sendMessage(`💬 معرف المحادثة:\n${threadID}`, threadID);
    }
    if (mentionIDs.length) {
      const lines = mentionIDs.map(id => `👤 ${(mentions[id] || "").replace(/@/g, "")}: ${id}`);
      return api.sendMessage(`🆔 معرّفات المستخدمين:\n${lines.join("\n")}`, threadID);
    }
    api.sendMessage(
      `🆔 معلوماتك:\n👤 معرفك: ${senderID}\n💬 معرف المحادثة: ${threadID}`,
      threadID
    );
  }
};
