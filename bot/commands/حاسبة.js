module.exports = {
  name: "حاسبة",
  aliases: ["calc", "احسب"],
  description: "حاسبة رياضية آمنة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const expr = args.join(" ").replace(/[^0-9+\-*/().%\s]/g, "");
    if (!expr) return api.sendMessage("⚠️ الاستخدام: حاسبة [معادلة]\nمثال: حاسبة 25 * 4 + 10", threadID);
    try {
      const result = Function('"use strict"; return (' + expr + ')')();
      if (!isFinite(result)) return api.sendMessage("❌ النتيجة غير صالحة (قسمة على صفر؟).", threadID);
      api.sendMessage(`🧮 الحاسبة\n━━━━━━━━━━━━━\n📝 المعادلة: ${expr}\n✅ النتيجة: ${result}`, threadID);
    } catch {
      api.sendMessage("❌ معادلة غير صحيحة. تحقق من الصيغة.", threadID);
    }
  }
};
