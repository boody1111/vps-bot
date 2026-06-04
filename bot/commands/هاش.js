const crypto = require("crypto");

module.exports = {
  name: "هاش",
  aliases: ["hash", "تشفير_هاش"],
  description: "توليد هاش تشفيري (MD5، SHA-1، SHA-256، SHA-512)",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const algo = (args[0] || "sha256").toLowerCase();
    const text = args.slice(1).join(" ");
    if (!text) return api.sendMessage("⚠️ الاستخدام: هاش [خوارزمية] [نص]\nمثال: هاش sha256 مرحبا\nالخوارزميات: md5 | sha1 | sha256 | sha512", threadID);
    const supported = { md5: "md5", sha1: "sha1", sha256: "sha256", sha512: "sha512" };
    const algoKey = supported[algo];
    if (!algoKey) return api.sendMessage("❌ خوارزمية غير مدعومة. الخيارات: md5 | sha1 | sha256 | sha512", threadID);
    try {
      const result = crypto.createHash(algoKey).update(text, "utf8").digest("hex");
      api.sendMessage(
        `🔐 الهاش (${algoKey.toUpperCase()})\n━━━━━━━━━━━━━\n📝 النص: ${text}\n🔑 الهاش:\n${result}`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل التشفير.", threadID);
    }
  }
};
