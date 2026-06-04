const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

function ytSearch(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const match = data.match(/"videoId":"([^"]+)"/);
        if (match) resolve(match[1]);
        else reject(new Error("no results"));
      });
    }).on("error", reject);
  });
}

function downloadAudio(videoId) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://youtube-mp3-downloader-api.p.rapidapi.com/download?id=${videoId}`;
    const url2 = `https://api.vevioz.com/api/button/mp3/${videoId}`;
    // fallback: use cobalt-like free endpoint
    const cobalt = `https://api.cobalt.tools/api/json`;
    const body = JSON.stringify({ url: `https://youtu.be/${videoId}`, isAudioOnly: true, aFormat: "mp3" });

    const req = https.request({
      hostname: "api.cobalt.tools",
      path: "/api/json",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(body),
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if (j.url) resolve(j.url);
          else reject(new Error("no url"));
        } catch { reject(new Error("parse")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

module.exports = {
  name: "song",
  aliases: ["اغنية", "موسيقى", "music"],
  description: "تحميل أغنية من يوتيوب (MP3)",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const query = args.join(" ");
    if (!query) return api.sendMessage("⚠️ الاستخدام: song [اسم الأغنية]\nمثال: song عمر خيرت", threadID);

    api.sendMessage(`🎵 جارٍ البحث عن: "${query}"...`, threadID);
    try {
      const videoId = await ytSearch(query);
      const audioUrl = await downloadAudio(videoId);
      const tmpPath = path.join(os.tmpdir(), `song_${Date.now()}.mp3`);
      await downloadFile(audioUrl, tmpPath);
      api.sendMessage({
        body: `🎵 ${query}`,
        attachment: fs.createReadStream(tmpPath)
      }, threadID, () => {
        try { fs.unlinkSync(tmpPath); } catch {}
      });
    } catch (e) {
      api.sendMessage(`❌ فشل التحميل: ${e.message}\nحاول مع رابط يوتيوب مباشرة أو اسم مختلف.`, threadID);
    }
  }
};
