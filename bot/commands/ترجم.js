const https = require("https");

const LANGS = {
  ar: "عربي", en: "إنجليزي", fr: "فرنسي", de: "ألماني",
  es: "إسباني", tr: "تركي", fa: "فارسي", ru: "روسي",
  zh: "صيني", ja: "ياباني", ko: "كوري", it: "إيطالي"
};

function translate(text, to = "ar", from = "auto") {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const translated = json[0].map(x => x[0]).join("");
          const detectedLang = json[2] || from;
          resolve({ translated, detectedLang });
        } catch { reject(new Error("parse")); }
      });
    }).on("error", reject);
  });
}

module.exports = {
  name: "ترجم",
  aliases: ["translate", "translation", "trans"],
  description: "ترجمة النصوص بين اللغات",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, messageReply } = event;
    let to = "ar", text = "";

    if (args[0] && LANGS[args[0]]) {
      to = args.shift();
      text = args.join(" ");
    } else {
      text = args.join(" ");
    }

    if (!text && messageReply?.body) text = messageReply.body;
    if (!text) return api.sendMessage("⚠️ الاستخدام: ترجم [لغة] [نص]\nاللغات: " + Object.keys(LANGS).join(" | "), threadID);

    try {
      const { translated, detectedLang } = await translate(text, to);
      const fromLabel = LANGS[detectedLang] || detectedLang;
      const toLabel = LANGS[to] || to;
      api.sendMessage(
        `🌍 ترجمة: ${fromLabel} ← ${toLabel}\n━━━━━━━━━━━━━\n${translated}`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل الاتصال بخدمة الترجمة.", threadID);
    }
  }
};
