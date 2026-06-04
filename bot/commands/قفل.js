module.exports = {
  name: "قفل",
  description: "يقفل البوت ويمنع غير المشرفين من التفاعل معه",
  usage: "قفل تفعيل / قفل ايقاف",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!action) {
      return api.sendMessage(
        `❓ الاستخدام:\n${settings.prefix}قفل تفعيل\n${settings.prefix}قفل ايقاف`,
        threadID,
        null,
        messageID
      );
    }

    if (action === "تفعيل") {
      if (state.locked) {
        return api.sendMessage("ℹ️ البوت مقفل بالفعل.", threadID, null, messageID);
      }
      state.locked = true;
      api.sendMessage(
        "🔒 تم قفل البوت.\nلا يمكن لأحد التفاعل مع البوت سوى المشرفين.",
        threadID,
        null,
        messageID
      );

    } else if (action === "ايقاف") {
      if (!state.locked) {
        return api.sendMessage("ℹ️ البوت غير مقفل أصلاً.", threadID, null, messageID);
      }
      state.locked = false;
      api.sendMessage("🔓 تم فتح البوت. يمكن للجميع التفاعل معه الآن.", threadID, null, messageID);

    } else {
      api.sendMessage(
        `❓ الاستخدام:\n${settings.prefix}قفل تفعيل\n${settings.prefix}قفل ايقاف`,
        threadID,
        null,
        messageID
      );
    }
  },
};
