const { registerReplyHandler } = require("../handler");

const TRUTHS = [
  "من أكثر شخص تحبه في المجموعة؟",
  "ما أكبر كذبة قلتها في حياتك؟",
  "من أول شخص تتصل به عند المشاكل؟",
  "ما أغرب شيء فعلته وحدك؟",
  "من آخر شخص بكيت بسببه؟",
  "ما أكثر شيء تخجل منه؟",
  "ما حلمك الذي تخشى البوح به؟",
  "من الشخص الذي لا تستطيع نسيانه؟",
  "ما الشيء الذي تفعله سراً؟",
  "ما أكبر خوفك في الحياة؟",
];

const DARES = [
  "أرسل أول صورة في معرضك الآن!",
  "اكتب رسالة حب لأول شخص في جهات اتصالك.",
  "غير اسمك في المجموعة لمدة ساعة.",
  "أرسل ستيكر محرج.",
  "اكتب 3 أشياء تكرهها في نفسك.",
  "امدح شخصاً في المجموعة لا تحبه.",
  "اكتب أغنيتك المفضلة كاملة.",
  "اكتب تعليقك الصادق على كل شخص في المجموعة.",
  "أرسل آخر كليب شاهدته على يوتيوب.",
  "اكتب رأيك الحقيقي في المحادثة.",
];

module.exports = {
  name: "صراحة",
  aliases: ["truth", "dare", "صراحة_أو_جرأة"],
  description: "لعبة صراحة أو جرأة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    api.sendMessage(
      `🎭 صراحة أم جرأة؟\n━━━━━━━━━━━━━\n↩️ اختر:\n• صراحة\n• جرأة`,
      threadID
    );

    registerReplyHandler(threadID, senderID, (api, ev) => {
      const choice = (ev.body || "").trim();
      if (choice === "صراحة" || choice === "truth") {
        const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
        api.sendMessage(`🤔 صراحة:\n━━━━━━━━━━━━━\n${q}`, threadID);
      } else if (choice === "جرأة" || choice === "dare") {
        const d = DARES[Math.floor(Math.random() * DARES.length)];
        api.sendMessage(`😈 جرأة:\n━━━━━━━━━━━━━\n${d}`, threadID);
      } else {
        api.sendMessage("⚠️ اختر: صراحة أو جرأة", threadID);
        registerReplyHandler(threadID, senderID, arguments.callee, 30000);
      }
    }, 30000);
  }
};
