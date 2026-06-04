module.exports = {
  name: "تاريخ",
  aliases: ["date", "datecalc", "فرق_تاريخ"],
  description: "حساب فرق التاريخ أو اليوم الحالي",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const now = new Date();

    if (!args.length) {
      const days = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
      const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
      return api.sendMessage(
        `📅 التاريخ الحالي\n━━━━━━━━━━━━━\n` +
        `📆 ${days[now.getDay()]}، ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}\n` +
        `🕐 الوقت: ${now.toLocaleTimeString("ar-SA")}`,
        threadID
      );
    }

    const d1 = new Date(args[0]);
    const d2 = args[1] ? new Date(args[1]) : now;
    if (isNaN(d1)) return api.sendMessage("⚠️ تاريخ غير صالح.\nمثال: تاريخ 2024-01-01 2025-01-01", threadID);

    const diffMs = Math.abs(d2 - d1);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.44);
    const diffYears = Math.floor(diffDays / 365.25);

    api.sendMessage(
      `📅 حساب فرق التاريخ\n━━━━━━━━━━━━━\n` +
      `📆 من: ${d1.toLocaleDateString("ar-SA")}\n` +
      `📆 إلى: ${d2.toLocaleDateString("ar-SA")}\n` +
      `━━━━━━━━━━━━━\n` +
      `📊 الفرق:\n• ${diffDays.toLocaleString()} يوم\n• ${diffWeeks.toLocaleString()} أسبوع\n• ${diffMonths.toLocaleString()} شهر\n• ${diffYears.toLocaleString()} سنة`,
      threadID
    );
  }
};
