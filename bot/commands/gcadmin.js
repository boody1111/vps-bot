module.exports = {
  name: "gcadmin",
  aliases: ["مشرف", "admin_group"],
  description: "ترقية أو إزالة مشرف في المجموعة",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, mentions, messageReply } = event;
    const sub = args[0];
    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID || args[1];
    if (!targetID) return api.sendMessage("⚠️ الاستخدام:\n• مشرف ترقية @مستخدم\n• مشرف إزالة @مستخدم", threadID);
    if (sub === "ترقية" || sub === "add" || sub === "اضافة") {
      try {
        await api.changeAdminStatus(threadID, targetID, true);
        api.sendMessage(`✅ تم ترقية العضو إلى مشرف.`, threadID);
      } catch (e) {
        api.sendMessage(`❌ فشل الترقية: ${e.message}`, threadID);
      }
    } else if (sub === "إزالة" || sub === "remove" || sub === "حذف") {
      try {
        await api.changeAdminStatus(threadID, targetID, false);
        api.sendMessage(`✅ تم إزالة صلاحيات المشرف.`, threadID);
      } catch (e) {
        api.sendMessage(`❌ فشل الإزالة: ${e.message}`, threadID);
      }
    } else {
      api.sendMessage("⚠️ الاستخدام:\n• مشرف ترقية @مستخدم\n• مشرف إزالة @مستخدم", threadID);
    }
  }
};
