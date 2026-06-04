const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

function fetchTikTok(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
    https.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("parse")); } });
    }).on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

module.exports = {
  name: "تيكتوك",
  aliases: ["tiktok", "tt", "tikwm"],
  description: "تحميل فيديو تيكتوك بدون علامة مائية",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const url = args[0];
    if (!url || !url.includes("tiktok")) return api.sendMessage("⚠️ الاستخدام: تيكتوك [رابط تيكتوك]", threadID);
    api.sendMessage("⏳ جارٍ تحميل الفيديو...", threadID);
    try {
      const data = await fetchTikTok(url);
      if (!data?.data?.play) return api.sendMessage("❌ فشل جلب الفيديو. تحقق من الرابط.", threadID);
      const videoUrl = data.data.hdplay || data.data.play;
      const title = (data.data.title || "فيديو تيكتوك").slice(0, 100);
      const tmpPath = path.join(os.tmpdir(), `tt_${Date.now()}.mp4`);
      await downloadFile(videoUrl, tmpPath);
      api.sendMessage({ body: `🎵 ${title}`, attachment: fs.createReadStream(tmpPath) }, threadID, () => {
        try { fs.unlinkSync(tmpPath); } catch {}
      });
    } catch (e) {
      api.sendMessage(`❌ فشل التحميل: ${e.message}`, threadID);
    }
  }
};
