module.exports = {
  name: "ذكرني",
  aliases: ["remind", "reminder", "تذكير"],
  description: "ضبط تذكير بعد وقت محدد",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    if (!args.length) return api.sendMessage("⚠️ الاستخدام: ذكرني [وقت] [رسالة]\nمثال: ذكرني 30m صلاة العصر\nمثال: ذكرني 2h اجتماع", threadID);

    const timeStr = args[0];
    const message = args.slice(1).join(" ") || "تذكير!";
    const match = timeStr.match(/^(\d+)(s|m|h|d)?$/i);
    if (!match) return api.sendMessage("⚠️ صيغة الوقت غير صحيحة. مثال: 30m أو 2h أو 1d", threadID);

    const num = parseInt(match[1]);
    const unit = (match[2] || "m").toLowerCase();
    const ms = unit === "d" ? num * 86400000 : unit === "h" ? num * 3600000 : unit === "m" ? num * 60000 : num * 1000;

    if (ms > 7 * 24 * 3600 * 1000) return api.sendMessage("⚠️ الحد الأقصى للتذكير أسبوع واحد.", threadID);

    const label = unit === "d" ? `${num} يوم` : unit === "h" ? `${num} ساعة` : unit === "m" ? `${num} دقيقة` : `${num} ثانية`;
    api.sendMessage(`⏰ تم ضبط التذكير بعد ${label}!`, threadID);

    setTimeout(async () => {
      let name = "صديقي";
      try { const info = await api.getUserInfo(senderID); name = info?.[senderID]?.name || name; } catch {}
      api.sendMessage(`⏰ تذكير لـ ${name}!\n━━━━━━━━━━━━━\n📝 ${message}`, threadID);
    }, ms);
  }
};
