const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "imgen",
  aliases: ["صورة_ذكاء", "ai_image", "image_gen"],
  description: "توليد صورة بالذكاء الاصطناعي (Pollinations AI)",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ الاستخدام: imgen [وصف الصورة بالإنجليزي]\nمثال: imgen a beautiful sunset over the ocean", threadID);

    api.sendMessage("🎨 جارٍ توليد الصورة... ⏳", threadID);

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=512&nologo=true`;
    const tmpPath = path.join(os.tmpdir(), `imgen_${Date.now()}.jpg`);

    const file = fs.createWriteStream(tmpPath);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      if (res.statusCode !== 200) {
        fs.unlink(tmpPath, () => {});
        return api.sendMessage(`❌ فشل التوليد (HTTP ${res.statusCode}).`, threadID);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        api.sendMessage({
          body: `🎨 الصورة المولّدة:\n📝 ${prompt}`,
          attachment: fs.createReadStream(tmpPath)
        }, threadID, () => {
          try { fs.unlinkSync(tmpPath); } catch {}
        });
      });
    }).on("error", err => {
      fs.unlink(tmpPath, () => {});
      api.sendMessage(`❌ فشل الاتصال: ${err.message}`, threadID);
    });
  }
};
