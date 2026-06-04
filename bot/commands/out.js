module.exports = {
  name: "out",
  aliases: ["خروج", "leave"],
  description: "إخراج البوت من المجموعة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    api.sendMessage("👋 مع السلامة! سأغادر المجموعة الآن.", threadID, () => {
      try { api.removeUserFromGroup(senderID, threadID); } catch {}
      setTimeout(() => { try { api.leaveThread(threadID); } catch {} }, 2000);
    });
  }
};
