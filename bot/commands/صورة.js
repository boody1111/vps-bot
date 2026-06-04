if (!global.groupImageLock) global.groupImageLock = new Map();

module.exports = {
  name: "صورة",
  aliases: ["image_lock", "lockimage", "قفل_صورة"],
  description: "قفل صورة المجموعة — يعيدها فور تغييرها",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    const sub = args[0];

    if (sub === "تفعيل" || sub === "on") {
      if (!messageReply?.attachments?.length) return api.sendMessage("⚠️ رد على الصورة التي تريد قفلها.", threadID);
      const att = messageReply.attachments.find(a => a.type === "photo");
      if (!att?.url) return api.sendMessage("❌ المرفق ليس صورة.", threadID);
      global.groupImageLock.set(threadID, att.url);
      return api.sendMessage("🔒 تم قفل صورة المجموعة. ستتم إعادتها فور تغييرها.", threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      global.groupImageLock.delete(threadID);
      return api.sendMessage("🔓 تم إيقاف قفل صورة المجموعة.", threadID);
    }

    const locked = global.groupImageLock.has(threadID);
    api.sendMessage(`🖼 قفل الصورة: ${locked ? "✅ مفعّل" : "❌ موقوف"}\n\nالأوامر: صورة تفعيل (رد على صورة) | صورة ايقاف`, threadID);
  }
};
