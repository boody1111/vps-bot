module.exports = {
  name: "صدى",
  aliases: ["echo", "say", "اقل"],
  description: "إعادة إرسال نص بصوت البوت",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const text = args.join(" ");
    if (!text) return api.sendMessage("⚠️ الاستخدام: صدى [النص]", threadID);
    api.sendMessage(text, threadID);
  }
};
