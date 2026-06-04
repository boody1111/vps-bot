const { registerReplyHandler } = require("../handler");

const QUESTIONS = [
  { q: "الشمس نجم وليس كوكباً", a: "صواب" },
  { q: "الفيل أكبر حيوان بري في العالم", a: "صواب" },
  { q: "الحوت أكبر حيوان على الإطلاق", a: "صواب" },
  { q: "القمر يضيء بضوئه الخاص", a: "خطأ" },
  { q: "الماء يغلي عند 90 درجة مئوية على مستوى البحر", a: "خطأ" },
  { q: "الذهب يذوب في الحمض", a: "خطأ" },
  { q: "النمل يمكنه رفع ما يعادل 50 ضعف وزنه", a: "صواب" },
  { q: "البيض حيوان", a: "خطأ" },
  { q: "الدلفين ثديي وليس سمكة", a: "صواب" },
  { q: "الأرض تدور حول نفسها كل 24 ساعة بالضبط", a: "خطأ" },
  { q: "الجمل يخزن الماء في سنامه", a: "خطأ" },
  { q: "الخفافيش عمياء تماماً", a: "خطأ" },
  { q: "الفيل هو الحيوان الثديي الوحيد الذي لا يستطيع القفز", a: "صواب" },
  { q: "المريخ أقرب كوكب إلى الأرض دائماً", a: "خطأ" },
  { q: "الصوت يتحرك أسرع من الضوء", a: "خطأ" },
];

module.exports = {
  name: "صواب_خطأ",
  aliases: ["truefalse", "tf"],
  description: "لعبة صواب أم خطأ — تريفيا",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const rounds = Math.min(parseInt(args[0]) || 5, 10);
    const pool = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, rounds);
    let idx = 0;
    const scores = new Map();

    function nextRound() {
      if (idx >= pool.length) {
        const sorted = [...scores.entries()].sort(([,a],[,b]) => b - a);
        const lines = sorted.map(([id, s], i) => `${i + 1}. ID ${id}: ${s}/${rounds}`);
        api.sendMessage(`🏆 انتهت اللعبة!\n━━━━━━━━━━━━━\n${lines.join("\n") || "لا توجد نقاط"}`, threadID);
        return;
      }
      const { q, a } = pool[idx++];
      api.sendMessage(`🧠 صواب أم خطأ؟ (${idx}/${rounds})\n━━━━━━━━━━━━━\n📌 ${q}\n\n↩️ اكتب: صواب أو خطأ`, threadID);

      function makeHandler() {
        return (api, ev) => {
          const ans = (ev.body || "").trim();
          const sid = ev.senderID;
          if (ans !== "صواب" && ans !== "خطأ") {
            api.sendMessage("⚠️ اكتب فقط: صواب أو خطأ", threadID);
            registerReplyHandler(threadID, "*", makeHandler(), 30000);
            return;
          }
          if (ans === a) {
            scores.set(sid, (scores.get(sid) || 0) + 1);
            api.sendMessage(`✅ صحيح! الإجابة: ${a}`, threadID);
          } else {
            api.sendMessage(`❌ خطأ! الإجابة الصحيحة: ${a}`, threadID);
          }
          setTimeout(nextRound, 1500);
        };
      }
      registerReplyHandler(threadID, "*", makeHandler(), 30000);
    }

    api.sendMessage(`🧠 لعبة صواب أم خطأ! ${rounds} أسئلة — تبدأ الآن!`, threadID);
    setTimeout(nextRound, 1000);
  }
};
