if (!global.nexusPolls) global.nexusPolls = new Map();

module.exports = {
  name: "تصويت",
  aliases: ["poll", "vote", "استطلاع"],
  description: "إنشاء تصويت جماعي في المجموعة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sub = args[0];

    if (sub === "نتيجة" || sub === "result" || sub === "results") {
      const poll = global.nexusPolls.get(threadID);
      if (!poll) return api.sendMessage("⚠️ لا يوجد تصويت نشط.", threadID);
      const total = Object.values(poll.votes).reduce((a, b) => a + b, 0);
      const lines = poll.options.map((opt, i) => {
        const count = poll.votes[i] || 0;
        const pct = total ? Math.round(count / total * 100) : 0;
        const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
        return `${i + 1}. ${opt}\n   ${bar} ${count} (${pct}%)`;
      });
      return api.sendMessage(
        `📊 نتائج التصويت: "${poll.question}"\n━━━━━━━━━━━━━\n${lines.join("\n")}\n━━━━━━━━━━━━━\nإجمالي: ${total} صوت`,
        threadID
      );
    }

    if (sub === "انهاء" || sub === "end" || sub === "close") {
      global.nexusPolls.delete(threadID);
      return api.sendMessage("✅ تم إنهاء التصويت.", threadID);
    }

    if (!sub) return api.sendMessage("⚠️ الاستخدام: تصويت [السؤال] | خيار1 | خيار2 | ...\nمثال: تصويت اللون الأفضل | أحمر | أزرق | أخضر", threadID);

    const text = args.join(" ");
    const parts = text.split("|").map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return api.sendMessage("⚠️ يجب توفير سؤال وخيارين على الأقل.\nمثال: تصويت السؤال | خيار1 | خيار2", threadID);

    const question = parts[0];
    const options = parts.slice(1).slice(0, 10);
    const votes = {};
    options.forEach((_, i) => votes[i] = 0);
    global.nexusPolls.set(threadID, { question, options, votes, voters: new Set() });

    const optLines = options.map((opt, i) => `${i + 1}. ${opt}`).join("\n");
    api.sendMessage(
      `📊 تصويت جديد!\n━━━━━━━━━━━━━\n❓ ${question}\n━━━━━━━━━━━━━\n${optLines}\n━━━━━━━━━━━━━\n` +
      `للتصويت اكتب: صوّت [رقم الخيار]\nللنتائج: تصويت نتيجة`,
      threadID
    );
  }
};
