module.exports = {
  name: "بروفايل",
  aliases: ["avatar_bot", "setpp", "تغيير_الصورة"],
  description: "تغيير صورة البروفايل للبوت (رد على صورة)",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    if (!messageReply?.attachments?.length) return api.sendMessage("⚠️ رد على صورة لتغيير بروفايل البوت.", threadID);
    const attachment = messageReply.attachments.find(a => a.type === "photo" || a.type === "sticker");
    if (!attachment?.url) return api.sendMessage("❌ المرفق ليس صورة.", threadID);

    if (typeof api.changeAvatar !== "function") {
      return api.sendMessage("⚠️ تغيير صورة البروفايل غير مدعوم في هذا الإصدار.", threadID);
    }

    const https = require("https");
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const tmpPath = path.join(os.tmpdir(), `avatar_${Date.now()}.jpg`);
    const file = fs.createWriteStream(tmpPath);
    https.get(attachment.url, res => {
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        api.changeAvatar(fs.createReadStream(tmpPath), "", err => {
          try { fs.unlinkSync(tmpPath); } catch {}
          if (err) return api.sendMessage(`❌ فشل تغيير الصورة: ${err.message}`, threadID);
          api.sendMessage("✅ تم تغيير صورة البروفايل!", threadID);
        });
      });
    }).on("error", err => {
      fs.unlink(tmpPath, () => {});
      api.sendMessage(`❌ فشل تحميل الصورة: ${err.message}`, threadID);
    });
  }
};
