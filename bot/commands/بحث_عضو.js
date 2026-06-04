module.exports = {
  name: "بحث_عضو",
  aliases: ["finduser", "searchuser"],
  description: "البحث عن عضو عبر منشنه أو معرفه",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || args[0];
    if (!targetID) return api.sendMessage("⚠️ الاستخدام: بحث_عضو @مستخدم\nأو: بحث_عضو [معرف]", threadID);

    try {
      const info = await api.getUserInfo(targetID);
      const user = info?.[targetID];
      if (!user) return api.sendMessage("❌ لم يُعثر على المستخدم.", threadID);
      const name = user.name || "مجهول";
      const gender = user.gender === 1 ? "ذكر" : user.gender === 2 ? "أنثى" : "—";
      api.sendMessage(
        `👤 معلومات العضو\n━━━━━━━━━━━━━\n` +
        `📛 الاسم: ${name}\n` +
        `🆔 المعرف: ${targetID}\n` +
        `⚥ الجنس: ${gender}\n` +
        `🔗 الرابط: https://facebook.com/profile.php?id=${targetID}`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل جلب معلومات المستخدم.", threadID);
    }
  }
};
