const { registerReplyHandler } = require("../handler");

module.exports = {
  name: "خمن",
  aliases: ["guess", "تخمين"],
  description: "لعبة تخمين الرقم السري",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const max = Math.min(parseInt(args[0]) || 100, 1000);
    const secret = Math.floor(Math.random() * max) + 1;
    let attempts = 0;
    const maxAttempts = Math.ceil(Math.log2(max)) + 2;

    api.sendMessage(
      `🔢 لعبة التخمين\n━━━━━━━━━━━━━\n🎯 خمّن رقماً بين 1 و ${max}\n🔄 عدد المحاولات: ${maxAttempts}\n\n↩️ اكتب رقمك`,
      threadID
    );

    function makeHandler() {
      return (api, ev) => {
        const guess = parseInt((ev.body || "").trim());
        if (isNaN(guess)) {
          api.sendMessage("⚠️ أدخل رقماً صحيحاً.", threadID);
          registerReplyHandler(threadID, senderID, makeHandler(), 120000);
          return;
        }
        attempts++;
        if (guess === secret) {
          api.sendMessage(`🎉 صحيح! الرقم كان ${secret}!\n✅ فزت في ${attempts} محاولة من ${maxAttempts}`, threadID);
          return;
        }
        if (attempts >= maxAttempts) {
          api.sendMessage(`💀 انتهت المحاولات! الرقم كان ${secret}`, threadID);
          return;
        }
        const hint = guess < secret ? "📈 أكبر" : "📉 أصغر";
        api.sendMessage(`${hint}\nالمحاولة ${attempts}/${maxAttempts} — حاول مجدداً:`, threadID);
        registerReplyHandler(threadID, senderID, makeHandler(), 120000);
      };
    }

    registerReplyHandler(threadID, senderID, makeHandler(), 120000);
  }
};
