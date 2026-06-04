const ANSWERS = [
  "نعم بالتأكيد 🎱", "كل المؤشرات تشير لذلك 🎱", "بالتأكيد 🎱",
  "أعتمد عليه 🎱", "كما أرى، نعم 🎱", "على الأرجح 🎱",
  "الآفاق تبدو جيدة 🎱", "نعم 🎱",
  "الجواب ضبابي، أعد السؤال 🎱", "أسأل لاحقاً 🎱",
  "الآن لا أستطيع التنبؤ 🎱", "التركيز مطلوب وأعد السؤال 🎱",
  "لا تعتمد على ذلك 🎱", "ردي لا 🎱",
  "مصادري تقول لا 🎱", "المستقبل لا يبدو جيداً 🎱",
  "مشكوك فيه جداً 🎱", "على الأرجح لا 🎱",
  "لا تعوّل على ذلك 🎱", "لا أحتمال تقريباً 🎱"
];

module.exports = {
  name: "كرة8",
  aliases: ["8ball", "ball8", "سحرية"],
  description: "كرة السحر — اسألها أي سؤال",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const question = args.join(" ");
    if (!question) return api.sendMessage("⚠️ اكتب سؤالك بعد الأمر.\nمثال: كرة8 هل سيكون يومي جيداً؟", threadID);
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    api.sendMessage(`🎱 كرة السحر\n━━━━━━━━━━━━━\n❓ ${question}\n\n${answer}`, threadID);
  }
};
