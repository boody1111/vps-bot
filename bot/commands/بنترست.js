const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

function searchPinterest(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%7D%7D`;
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          const pins = j?.resource_response?.data?.results || [];
          const imgUrls = pins
            .filter(p => p?.images?.["736x"]?.url)
            .map(p => p.images["736x"].url)
            .slice(0, 5);
          resolve(imgUrls);
        } catch { reject(new Error("parse")); }
      });
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
  name: "بنترست",
  aliases: ["pinterest", "pin", "pins"],
  description: "بحث عن صور على Pinterest",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ الاستخدام: بنترست [كلمة البحث]\nمثال: بنترست anime girl", threadID);

    api.sendMessage(`🔍 جارٍ البحث في Pinterest...`, threadID);
    try {
      const urls = await searchPinterest(query);
      if (!urls.length) return api.sendMessage("❌ لم تُعثر على نتائج.", threadID);

      const imgUrl = urls[Math.floor(Math.random() * urls.length)];
      const tmpPath = path.join(os.tmpdir(), `pin_${Date.now()}.jpg`);
      await downloadFile(imgUrl, tmpPath);
      api.sendMessage({
        body: `📌 Pinterest: ${query}`,
        attachment: fs.createReadStream(tmpPath)
      }, threadID, () => { try { fs.unlinkSync(tmpPath); } catch {} });
    } catch {
      api.sendMessage("❌ فشل البحث في Pinterest.", threadID);
    }
  }
};
