module.exports = {
  name: "groupname",
  aliases: ["اسم", "rename", "غير_اسم"],
  description: "تغيير اسم المجموعة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const newName = args.join(" ");
    if (!newName) return api.sendMessage("⚠️ الاستخدام: groupname [الاسم الجديد]", threadID);
    api.setTitle(newName, threadID, err => {
      if (err) return api.sendMessage(`❌ فشل تغيير الاسم: ${err.message}`, threadID);
      api.sendMessage(`✅ تم تغيير اسم المجموعة إلى: ${newName}`, threadID);
    });
  }
};
