const crypto = require("crypto");

module.exports = {
  name: "كلمة_سر",
  aliases: ["password", "passgen", "كلمةسر"],
  description: "توليد كلمة مرور عشوائية آمنة",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const length = Math.min(Math.max(parseInt(args[0]) || 16, 4), 64);
    const includeSymbols = args.includes("رموز") || args.includes("symbols") || args.includes("-s");
    const chars =
      "abcdefghijklmnopqrstuvwxyz" +
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
      "0123456789" +
      (includeSymbols ? "!@#$%^&*()-_=+[]{}|;:,.<>?" : "");
    let pass = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      pass += chars[bytes[i] % chars.length];
    }
    const strength = length < 8 ? "ضعيفة 🔴" : length < 12 ? "متوسطة 🟡" : length < 20 ? "قوية 🟢" : "قوية جداً 💪";
    api.sendMessage(
      `🔐 كلمة مرور جديدة\n━━━━━━━━━━━━━\n🔑 ${pass}\n\n📏 الطول: ${length} حرف\n💪 القوة: ${strength}\n\n⚠️ احفظها في مكان آمن!`,
      threadID
    );
  }
};
