const { registerReplyHandler } = require("../handler");

const FLAGS = [
  { flag: "🇸🇦", country: "السعودية" },
  { flag: "🇦🇪", country: "الإمارات" },
  { flag: "🇰🇼", country: "الكويت" },
  { flag: "🇶🇦", country: "قطر" },
  { flag: "🇧🇭", country: "البحرين" },
  { flag: "🇴🇲", country: "عُمان" },
  { flag: "🇯🇴", country: "الأردن" },
  { flag: "🇱🇧", country: "لبنان" },
  { flag: "🇸🇾", country: "سوريا" },
  { flag: "🇮🇶", country: "العراق" },
  { flag: "🇪🇬", country: "مصر" },
  { flag: "🇱🇾", country: "ليبيا" },
  { flag: "🇹🇳", country: "تونس" },
  { flag: "🇩🇿", country: "الجزائر" },
  { flag: "🇲🇦", country: "المغرب" },
  { flag: "🇾🇪", country: "اليمن" },
  { flag: "🇸🇩", country: "السودان" },
  { flag: "🇺🇸", country: "أمريكا" },
  { flag: "🇬🇧", country: "بريطانيا" },
  { flag: "🇫🇷", country: "فرنسا" },
  { flag: "🇩🇪", country: "ألمانيا" },
  { flag: "🇯🇵", country: "اليابان" },
  { flag: "🇨🇳", country: "الصين" },
  { flag: "🇷🇺", country: "روسيا" },
  { flag: "🇹🇷", country: "تركيا" },
];

module.exports = {
  name: "اعلام",
  aliases: ["flags", "flag", "علم"],
  description: "لعبة تخمين الأعلام",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const rounds = Math.min(parseInt(args[0]) || 5, 10);
    const pool = [...FLAGS].sort(() => Math.random() - 0.5).slice(0, rounds);
    let idx = 0;
    const scores = new Map();

    function nextRound() {
      if (idx >= pool.length) {
        const sorted = [...scores.entries()].sort(([,a],[,b]) => b - a);
        const lines = sorted.map(([id, s], i) => `${i + 1}. ID ${id}: ${s}/${rounds}`);
        api.sendMessage(`🏆 انتهت اللعبة!\n━━━━━━━━━━━━━\n${lines.join("\n") || "لا توجد نقاط"}`, threadID);
        return;
      }
      const { flag, country } = pool[idx++];
      api.sendMessage(`🏴 ما هذا العلم؟ (${idx}/${rounds})\n━━━━━━━━━━━━━\n${flag}\n\n↩️ اكتب اسم الدولة`, threadID);

      function makeHandler() {
        return (api, ev) => {
          const ans = (ev.body || "").trim().toLowerCase();
          const sid = ev.senderID;
          const correct = country.toLowerCase();
          if (ans === correct || ans === country) {
            scores.set(sid, (scores.get(sid) || 0) + 1);
            api.sendMessage(`✅ صحيح! ${flag} ${country}\n⭐ +1 نقطة`, threadID);
            setTimeout(nextRound, 1500);
          } else {
            api.sendMessage(`❌ خطأ! حاول مجدداً (${flag})`, threadID);
            registerReplyHandler(threadID, "*", makeHandler(), 30000);
          }
        };
      }
      registerReplyHandler(threadID, "*", makeHandler(), 30000);
    }

    api.sendMessage(`🏴 لعبة الأعلام! ${rounds} جولات — تبدأ الآن!`, threadID);
    setTimeout(nextRound, 1000);
  }
};
