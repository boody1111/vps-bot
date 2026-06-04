module.exports = {
  name: "مؤقت",
  aliases: ["timer", "عداد"],
  description: "عداد تنازلي — ينبهك عند الانتهاء",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const raw = args[0];
    if (!raw) return api.sendMessage("⚠️ الاستخدام: مؤقت [وقت]\nمثال: مؤقت 30s أو مؤقت 2m أو مؤقت 1h", threadID);
    const match = raw.match(/^(\d+)(s|m|h)?$/i);
    if (!match) return api.sendMessage("⚠️ صيغة غير صحيحة. مثال: 30s أو 2m أو 1h", threadID);
    const num = parseInt(match[1]);
    const unit = (match[2] || "s").toLowerCase();
    const ms = unit === "h" ? num * 3600000 : unit === "m" ? num * 60000 : num * 1000;
    const max = 2 * 60 * 60 * 1000;
    if (ms > max) return api.sendMessage("⚠️ الحد الأقصى للمؤقت ساعتان.", threadID);
    const label = unit === "h" ? `${num} ساعة` : unit === "m" ? `${num} دقيقة` : `${num} ثانية`;
    api.sendMessage(`⏱ تم ضبط مؤقت لـ ${label}. سأنبهك عند الانتهاء!`, threadID);
    setTimeout(() => {
      api.sendMessage(`⏰ انتهى المؤقت!\n⏱ كان المؤقت: ${label}`, threadID);
    }, ms);
  }
};
