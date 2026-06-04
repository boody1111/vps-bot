module.exports = {
  name: "nm",
  description: "يقفل اسم المجموعة ويمنع تغييره",
  usage: "nm تفعيل [الاسم] / nm ايقاف",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!action) {
      return api.sendMessage(
        `❓ الاستخدام:\n${settings.prefix}nm تفعيل [الاسم]\n${settings.prefix}nm ايقاف`,
        threadID,
        null,
        messageID
      );
    }

    if (action === "تفعيل") {
      const name = args.slice(1).join(" ");
      if (!name) {
        return api.sendMessage("⚠️ يرجى تحديد الاسم المراد قفله.\nمثال: nm تفعيل اسم المجموعة", threadID, null, messageID);
      }

      state.nameLock.active = true;
      state.nameLock.name = name;
      state.nameLock.threadId = threadID;

      // Set the name immediately
      api.setTitle(name, threadID, (err) => {
        if (err) {
          return api.sendMessage(`❌ فشل في تعيين الاسم: ${err.message}`, threadID, null, messageID);
        }
        api.sendMessage(`✅ تم تفعيل قفل الاسم\n🔒 الاسم المحفوظ: "${name}"\nسيتم استعادة الاسم تلقائياً عند أي تغيير.`, threadID, null, messageID);
      });

    } else if (action === "ايقاف") {
      if (!state.nameLock.active) {
        return api.sendMessage("ℹ️ قفل الاسم غير مفعّل أصلاً.", threadID, null, messageID);
      }
      state.nameLock.active = false;
      state.nameLock.name = null;
      state.nameLock.threadId = null;
      api.sendMessage("🔓 تم إيقاف قفل اسم المجموعة.", threadID, null, messageID);

    } else {
      api.sendMessage(
        `❓ الاستخدام:\n${settings.prefix}nm تفعيل [الاسم]\n${settings.prefix}nm ايقاف`,
        threadID,
        null,
        messageID
      );
    }
  },
};
