const https = require("https");

function apiGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("parse")); } });
    }).on("error", reject);
  });
}

if (!global.tempMails) global.tempMails = new Map();

module.exports = {
  name: "tempmail",
  aliases: ["بريد_مؤقت", "email", "mail"],
  description: "إنشاء بريد إلكتروني مؤقت والتحقق منه",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const sub = args[0];

    if (sub === "تحقق" || sub === "check" || sub === "inbox") {
      const mail = global.tempMails.get(senderID);
      if (!mail) return api.sendMessage("⚠️ ليس لديك بريد مؤقت. أنشئ واحداً أولاً: tempmail جديد", threadID);
      try {
        const msgs = await apiGet(`https://www.1secmail.com/api/v1/?action=getMessages&login=${mail.login}&domain=${mail.domain}`);
        if (!msgs.length) return api.sendMessage(`📭 لا توجد رسائل في: ${mail.full}`, threadID);
        const latest = msgs.slice(0, 3).map((m, i) => `${i + 1}. من: ${m.from}\n   الموضوع: ${m.subject}`).join("\n\n");
        return api.sendMessage(`📬 رسائل ${mail.full} (${msgs.length}):\n━━━━━━━━━━━━━\n${latest}`, threadID);
      } catch {
        return api.sendMessage("❌ فشل جلب الرسائل.", threadID);
      }
    }

    try {
      const domains = await apiGet("https://www.1secmail.com/api/v1/?action=getDomainList");
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const login = Math.random().toString(36).slice(2, 10);
      const full = `${login}@${domain}`;
      global.tempMails.set(senderID, { login, domain, full });
      setTimeout(() => global.tempMails.delete(senderID), 30 * 60 * 1000);
      api.sendMessage(
        `📧 بريدك المؤقت\n━━━━━━━━━━━━━\n📮 ${full}\n\n⏱ صالح لـ 30 دقيقة\n📥 تحقق: tempmail تحقق`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل إنشاء البريد المؤقت.", threadID);
    }
  }
};
