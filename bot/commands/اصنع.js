const https = require("https");

function callAI(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "openai-large",
      messages: [
        {
          role: "system",
          content: `أنت مساعد متخصص في كتابة كود JavaScript لبوتات Messenger.
عند طلب كود، اكتب كوداً كاملاً وجاهزاً للنشر في ملف .js.
اتبع هذا الهيكل:
module.exports = {
  name: "اسم_الأمر",
  aliases: [],
  description: "وصف",
  adminOnly: false,
  execute(api, event, args, settings, state) { ... }
};`
        },
        { role: "user", content: prompt }
      ]
    });
    const req = https.request({
      hostname: "text.pollinations.ai",
      path: "/openai",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || data);
        } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

module.exports = {
  name: "اصنع",
  aliases: ["create", "gen", "code", "كود"],
  description: "توليد كود أمر جديد باستخدام الذكاء الاصطناعي",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const request = args.join(" ");
    if (!request) return api.sendMessage("⚠️ الاستخدام: اصنع [وصف ما تريد]\nمثال: اصنع أمر يرسل نكتة عشوائية باللغة العربية", threadID);

    api.sendMessage("🤖 جارٍ توليد الكود... ⏳", threadID);
    try {
      const code = await callAI(`اصنع أمر بوت ماسنجر: ${request}`);
      const preview = code.slice(0, 1500);
      api.sendMessage(
        `✅ الكود المولّد:\n━━━━━━━━━━━━━\n${preview}${code.length > 1500 ? "\n...(الكود أطول، يُنصح بنسخه من هنا)" : ""}`,
        threadID
      );
    } catch (e) {
      api.sendMessage(`❌ فشل التوليد: ${e.message}`, threadID);
    }
  }
};
