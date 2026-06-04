'use strict';

module.exports = {
  name: "رست",
  aliases: ["restart", "اعادة_تشغيل", "اعادة"],
  description: "إعادة تشغيل البوت (للمشرفين فقط)",
  adminOnly: true,

  execute(api, event) {
    const { threadID, messageID } = event;
    try { api.sendMessage("🔄 جاري إعادة تشغيل البوت...", threadID, () => {}, messageID); } catch(e) {}
    setTimeout(() => process.exit(1), 1500);
  },
};
