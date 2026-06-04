module.exports = {
  name: "بينغ",
  description: "يقيس سرعة استجابة البوت",
  adminOnly: false,

  execute(api, event, args, settings, state) {
    const start = Date.now();
    api.sendMessage("🏓 بينغ!", event.threadID, () => {
      const latency = Date.now() - start;
      api.sendMessage(`🏓 بونغ! الاستجابة: ${latency}ms`, event.threadID, null, event.messageID);
    });
  },
};
