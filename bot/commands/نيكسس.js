const https = require("https");

const MODELS = [
  "openai-large",
  "mistral",
  "llama",
];

if (!global.nexusHistory) global.nexusHistory = new Map();

const SYSTEM = `أنت بوت ذكاء اصطناعي متطور يتحدث العربية والإنجليزية. 
أجب بشكل مفيد، موجز، ودقيق. يمكنك الإجابة على أي سؤال.`;

function buildMessages(userId, msg) {
  const hist = global.nexusHistory.get(userId) || [];
  const messages = [{ role: "system", content: SYSTEM }];
  for (const h of hist.slice(-6)) messages.push(h);
  messages.push({ role: "user", content: msg });
  return messages;
}

function callAI(messages, modelIdx = 0) {
  return new Promise((resolve, reject) => {
    const model = MODELS[modelIdx] || MODELS[0];
    const body = JSON.stringify({ model, messages });
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
          const reply = json.choices?.[0]?.message?.content?.trim() || "";
          if (!reply && modelIdx < MODELS.length - 1) return callAI(messages, modelIdx + 1).then(resolve).catch(reject);
          resolve(reply || "لا توجد إجابة.");
        } catch {
          if (modelIdx < MODELS.length - 1) return callAI(messages, modelIdx + 1).then(resolve).catch(reject);
          resolve(data.trim() || "حدث خطأ.");
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

module.exports = {
  name: "نيكسس",
  aliases: ["ai", "ذكاء", "gpt", "chat"],
  description: "محادثة مع الذكاء الاصطناعي (Pollinations)",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const msg = args.join(" ");
    if (!msg) return api.sendMessage("🤖 اكتب رسالتك بعد الأمر.\nمثال: نيكسس ما هي عاصمة اليابان؟", threadID);

    if (msg === "مسح" || msg === "reset" || msg === "clear") {
      global.nexusHistory.delete(senderID);
      return api.sendMessage("🗑 تم مسح سجل المحادثة.", threadID);
    }

    try {
      const messages = buildMessages(senderID, msg);
      const reply = await callAI(messages);
      const hist = global.nexusHistory.get(senderID) || [];
      hist.push({ role: "user", content: msg });
      hist.push({ role: "assistant", content: reply });
      if (hist.length > 12) hist.splice(0, hist.length - 12);
      global.nexusHistory.set(senderID, hist);
      api.sendMessage(`🤖 ${reply}`, threadID);
    } catch (e) {
      api.sendMessage("❌ فشل الاتصال بالذكاء الاصطناعي. حاول لاحقاً.", threadID);
    }
  }
};
