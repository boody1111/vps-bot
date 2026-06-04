const https = require("https");

function shortenUrl(url) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(url);
    https.get(`https://tinyurl.com/api-create.php?url=${encoded}`, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data.trim()));
    }).on("error", reject);
  });
}

module.exports = {
  name: "قصر",
  aliases: ["shorten", "short", "اختصر"],
  description: "اختصار الروابط الطويلة باستخدام TinyURL",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const url = args[0];
    if (!url || !url.startsWith("http")) return api.sendMessage("⚠️ الاستخدام: قصر [رابط]\nمثال: قصر https://example.com/very-long-path", threadID);
    try {
      const short = await shortenUrl(url);
      if (!short.startsWith("http")) return api.sendMessage("❌ فشل الاختصار.", threadID);
      api.sendMessage(
        `🔗 اختصار الرابط\n━━━━━━━━━━━━━\n📎 الأصلي: ${url}\n✂️ المختصر: ${short}`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل الاتصال بخدمة الاختصار.", threadID);
    }
  }
};
