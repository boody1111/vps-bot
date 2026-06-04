module.exports = {
  name: "pair",
  aliases: ["زوج", "تزاوج", "ship"],
  description: "تزاوج عشوائي بين أعضاء المجموعة",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    try {
      const info = await api.getThreadInfo(threadID);
      const members = (info.participantIDs || []).filter(id => id !== senderID);
      if (members.length < 1) return api.sendMessage("⚠️ لا يوجد أعضاء كافيون في المجموعة.", threadID);

      const partner = members[Math.floor(Math.random() * members.length)];
      const [sInfo, pInfo] = await Promise.all([
        api.getUserInfo(senderID),
        api.getUserInfo(partner)
      ]);
      const sName = sInfo?.[senderID]?.name || "أنت";
      const pName = pInfo?.[partner]?.name || "الشريك";
      const love = Math.floor(Math.random() * 100) + 1;
      const hearts = "❤️".repeat(Math.floor(love / 20)) + "🖤".repeat(5 - Math.floor(love / 20));

      api.sendMessage(
        `💕 التوافق العشوائي\n━━━━━━━━━━━━━\n` +
        `👤 ${sName}\n💞 +\n👤 ${pName}\n━━━━━━━━━━━━━\n` +
        `${hearts}\n💖 نسبة التوافق: ${love}%\n` +
        `${love >= 80 ? "💑 توافق مذهل!" : love >= 50 ? "😊 توافق جيد!" : "🌱 يحتاج لمزيد من الوقت."}`,
        threadID
      );
    } catch {
      api.sendMessage("❌ حدث خطأ.", threadID);
    }
  }
};
