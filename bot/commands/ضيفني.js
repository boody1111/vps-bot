module.exports = {
  name: "ضيفني",
  aliases: ["addme", "أضفني", "invite"],
  description: "طلب إضافتك إلى مجموعة أخرى",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const targetThreadID = args[0];
    if (!targetThreadID) {
      return api.sendMessage("⚠️ الاستخدام: ضيفني [معرف المجموعة]\nمثال: ضيفني 100012345678", threadID);
    }
    try {
      await api.addUserToGroup(senderID, targetThreadID);
      api.sendMessage(`✅ تمت إضافتك إلى المجموعة ${targetThreadID}.`, threadID);
    } catch (e) {
      api.sendMessage(`❌ فشلت الإضافة: ${e.message}`, threadID);
    }
  }
};
