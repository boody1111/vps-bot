const DICE_FACES = ["⚀","⚁","⚂","⚃","⚄","⚅"];

module.exports = {
  name: "نرد",
  aliases: ["dice", "roll"],
  description: "رمي النرد — فردي أو تحدٍّ",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID, mentions } = event;
    const count = Math.min(parseInt(args[0]) || 1, 6);
    const opponent = Object.keys(mentions || {})[0];

    if (opponent && opponent !== senderID) {
      const p1Rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
      const p2Rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
      const s1 = p1Rolls.reduce((a, b) => a + b, 0);
      const s2 = p2Rolls.reduce((a, b) => a + b, 0);
      const winner = s1 > s2 ? "أنت" : s2 > s1 ? "خصمك" : "تعادل";
      return api.sendMessage(
        `🎲 تحدي النرد\n━━━━━━━━━━━━━\n` +
        `🅰️ أنت: ${p1Rolls.map(r => DICE_FACES[r - 1]).join(" ")} = ${s1}\n` +
        `🅱️ خصمك: ${p2Rolls.map(r => DICE_FACES[r - 1]).join(" ")} = ${s2}\n` +
        `━━━━━━━━━━━━━\n🏆 الفائز: ${winner}`,
        threadID
      );
    }

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    api.sendMessage(
      `🎲 نتيجة النرد:\n${rolls.map(r => DICE_FACES[r - 1]).join(" ")}\n${count > 1 ? `المجموع: ${total}` : ""}`.trim(),
      threadID
    );
  }
};
