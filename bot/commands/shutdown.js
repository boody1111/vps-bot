module.exports = {
  name: "shutdown",
  aliases: ["اغلاق", "اوقف", "إيقاف"],
  description: "إيقاف تشغيل البوت (مشرفون فقط)",
  adminOnly: true,
  execute(api, event) {
    const { threadID } = event;
    try { api.sendMessage("⚠️ جارٍ إيقاف البوت...", threadID, () => {}); } catch(e) {}
    setTimeout(() => process.exit(0), 2000);
  }
};
