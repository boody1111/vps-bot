const { registerReplyHandler } = require("../handler");

const WORDS = [
  "برتقال","سيارة","مدرسة","شجرة","كتاب","قمر","شمس","نجمة","بيت","ماء",
  "هواء","نار","جبل","بحر","نهر","صحراء","مدينة","قرية","فلسفة","علم",
  "حياة","سعادة","حزن","غضب","فرح","صديق","قلب","عقل","روح","جسد",
  "لغة","كلام","صوت","صمت","ضوء","ظلام","صباح","مساء","ربيع","صيف",
  "خريف","شتاء","يوم","ليل","أسبوع","شهر","سنة","تاريخ","مستقبل","وقت",
  "طعام","شراب","خبز","ملح","سكر","قهوة","شاي","حليب","تفاحة","موزة",
  "عنب","رمان","مانجا","فراولة","ليمون","بطيخ","سمك","دجاج","لحم","خضار",
];

function scramble(word) {
  const arr = [...word];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("") === word && word.length > 1 ? scramble(word) : arr.join("");
}

module.exports = {
  name: "كلمة",
  aliases: ["scramble", "تخليط"],
  description: "لعبة تخليط الكلمات — خمّن الكلمة الأصلية",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const sc = scramble(word);
    let tries = 0;

    api.sendMessage(
      `🔤 لعبة تخليط الكلمات\n━━━━━━━━━━━━━\n🔀 الكلمة المخلوطة:\n${sc}\n\n↩️ اكتب الكلمة الصحيحة (3 محاولات)`,
      threadID
    );

    registerReplyHandler(threadID, senderID, (api, ev) => {
      const ans = (ev.body || "").trim();
      tries++;
      if (ans === word) {
        api.sendMessage(`🎉 صحيح! الكلمة كانت: ${word}\n✅ ربحت في ${tries} محاولة`, threadID);
        return;
      }
      if (tries >= 3) {
        api.sendMessage(`💀 انتهت المحاولات!\nالكلمة كانت: ${word}`, threadID);
        return;
      }
      const hint = word[0] + "•".repeat(word.length - 2) + word.slice(-1);
      api.sendMessage(`❌ خطأ! المحاولة ${tries}/3\n💡 تلميح: ${hint}`, threadID);
      registerReplyHandler(threadID, senderID, arguments.callee, 60000);
    }, 60000);
  }
};
