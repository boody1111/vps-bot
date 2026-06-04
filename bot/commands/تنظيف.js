const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "تنظيف",
  aliases: ["clean", "cleanup", "clear_cache"],
  description: "تنظيف الملفات المؤقتة (موسيقى، فيديو، صور)",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const tmpDir = os.tmpdir();
    const extToClean = [".mp3", ".mp4", ".jpg", ".jpeg", ".png", ".webp", ".webm", ".ogg", ".m4a"];
    let count = 0;
    let size = 0;
    try {
      const files = fs.readdirSync(tmpDir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (extToClean.includes(ext)) {
          try {
            const fp = path.join(tmpDir, file);
            const st = fs.statSync(fp);
            size += st.size;
            fs.unlinkSync(fp);
            count++;
          } catch {}
        }
      }
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      api.sendMessage(
        `🧹 تنظيف الكاش\n━━━━━━━━━━━━━\n✅ تم حذف ${count} ملف\n💾 المساحة المُحررة: ${sizeMB} MB\n📂 المجلد: ${tmpDir}`,
        threadID
      );
    } catch (e) {
      api.sendMessage(`❌ فشل التنظيف: ${e.message}`, threadID);
    }
  }
};
