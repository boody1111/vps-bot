const { registerReplyHandler } = require("../handler");

function makeQuestion() {
  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b;
  if (op === "+") { a = Math.floor(Math.random() * 99) + 1; b = Math.floor(Math.random() * 99) + 1; }
  else if (op === "-") { a = Math.floor(Math.random() * 99) + 50; b = Math.floor(Math.random() * 49) + 1; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; }
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { question: `${a} ${op} ${b}`, answer };
}

module.exports = {
  name: "سريع",
  aliases: ["quick", "fastmath", "رياضيات_سريعة"],
  description: "لعبة الرياضيات السريعة — أسرعهم يفوز",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const rounds = Math.min(parseInt(args[0]) || 5, 10);
    const scores = new Map();
    let roundNum = 0;

    function nextRound() {
      roundNum++;
      if (roundNum > rounds) {
        const sorted = [...scores.entries()].sort(([,a],[,b]) => b - a);
        const lines = sorted.map(([id, s], i) => `${i + 1}. ${id}: ${s} نقطة`);
        api.sendMessage(`🏆 انتهت اللعبة!\n━━━━━━━━━━━━━\n${lines.join("\n") || "لا توجد نقاط"}`, threadID);
        return;
      }

      const { question, answer } = makeQuestion();
      const deadline = Date.now() + 15000;
      api.sendMessage(`⚡ الجولة ${roundNum}/${rounds}\n🔢 ${question} = ؟\n⏱ 15 ثانية`, threadID);

      function makeHandler() {
        return (api, ev) => {
          if (Date.now() > deadline) {
            api.sendMessage(`⏱ انتهى الوقت! الإجابة كانت: ${answer}`, threadID);
            setTimeout(nextRound, 2000);
            return;
          }
          const g = parseInt((ev.body || "").trim());
          if (g === answer) {
            const sid = ev.senderID;
            scores.set(sid, (scores.get(sid) || 0) + 1);
            api.sendMessage(`✅ صحيح! +1 نقطة`, threadID);
            setTimeout(nextRound, 1500);
            return;
          }
          registerReplyHandler(threadID, "*", makeHandler(), 15000, false);
        };
      }
      registerReplyHandler(threadID, "*", makeHandler(), 15000, false);

      setTimeout(() => {
        if (!global.nexusReplyHandlers?.has(`${threadID}:*`)) return;
        api.sendMessage(`⏱ انتهى الوقت! الإجابة كانت: ${answer}`, threadID);
        global.nexusReplyHandlers?.delete(`${threadID}:*`);
        setTimeout(nextRound, 2000);
      }, 15000);
    }

    api.sendMessage(`⚡ لعبة الرياضيات السريعة!\n${rounds} جولات — أول من يجيب صح يأخذ النقطة!\nتبدأ في 3 ثوانٍ...`, threadID);
    setTimeout(nextRound, 3000);
  }
};
