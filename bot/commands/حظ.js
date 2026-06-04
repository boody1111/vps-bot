module.exports = {
  name: "حظ",
  aliases: ["luck", "برجك", "fortune"],
  description: "حظك اليومي بناءً على معرفك",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const today = new Date().toDateString();
    const seed = parseInt(senderID.slice(-6)) + today.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const luck = (seed % 100) + 1;
    const stars = "⭐".repeat(Math.floor(luck / 20)) + "☆".repeat(5 - Math.floor(luck / 20));
    const fortunes = [
      "يوم رائع ينتظرك، استغله جيداً!",
      "الحظ في صفك اليوم، جرّب شيئاً جديداً.",
      "تحلّ بالصبر، النتائج ستأتي.",
      "يوم مناسب للتواصل مع الأصدقاء.",
      "الإبداع في ذروته، اصنع شيئاً.",
      "تجنّب المخاطرة اليوم.",
      "يوم للراحة والتأمل.",
      "نجاح كبير في الأفق.",
      "انتبه للتفاصيل الصغيرة اليوم.",
      "وقت مثالي لاتخاذ القرارات الكبيرة.",
    ];
    const fortune = fortunes[seed % fortunes.length];
    const label = luck >= 80 ? "ممتاز 🟢" : luck >= 60 ? "جيد 🟡" : luck >= 40 ? "متوسط 🟠" : "منخفض 🔴";
    api.sendMessage(
      `🌟 حظك اليومي\n━━━━━━━━━━━━━\n📅 ${today}\n${stars}\n💫 مستوى الحظ: ${luck}/100 (${label})\n✨ ${fortune}`,
      threadID
    );
  }
};
