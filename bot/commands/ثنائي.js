module.exports = {
  name: "ثنائي",
  aliases: ["binary", "bin"],
  description: "تحويل النص إلى ثنائي والعكس",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const mode = args[0];
    const text = args.slice(1).join(" ");
    if (!mode || !text) {
      return api.sendMessage(
        "⚠️ الاستخدام:\n• ثنائي تحويل [نص] — نص → ثنائي\n• ثنائي فك [ثنائي] — ثنائي → نص",
        threadID
      );
    }
    if (mode === "تحويل" || mode === "encode" || mode === "تشفير") {
      const bin = text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
      return api.sendMessage(`🔢 الناتج الثنائي:\n${bin}`, threadID);
    }
    if (mode === "فك" || mode === "decode" || mode === "فك_تشفير") {
      try {
        const decoded = text.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("");
        return api.sendMessage(`📝 النص المفكوك:\n${decoded}`, threadID);
      } catch {
        return api.sendMessage("❌ الثنائي غير صالح.", threadID);
      }
    }
    api.sendMessage("⚠️ الوضع غير معروف. استخدم تحويل أو فك.", threadID);
  }
};
