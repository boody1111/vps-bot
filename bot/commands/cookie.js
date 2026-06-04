const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.BOT_DIR || path.join(__dirname, "..");
const APPSTATE_PATH = path.join(DATA_DIR, "appstate.json");
const ALT_PATH = path.join(DATA_DIR, "alt.json");

module.exports = {
  name: "cookie",
  description: "يحدث ملفات الكوكيز (appstate.json و alt.json) يدوياً",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;

    try {
      const freshState = api.getAppState();

      if (!freshState || freshState.length === 0) {
        return api.sendMessage("❌ فشل في جلب الكوكيز الحالية.", threadID, null, messageID);
      }

      fs.writeFileSync(APPSTATE_PATH, JSON.stringify(freshState, null, 2), "utf8");
      fs.writeFileSync(ALT_PATH, JSON.stringify(freshState, null, 2), "utf8");

      const timestamp = new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });

      api.sendMessage(
        `✅ تم تحديث الكوكيز بنجاح!\n` +
          `📁 appstate.json — محدّث\n` +
          `📁 alt.json — محدّث\n` +
          `🕐 الوقت: ${timestamp}\n` +
          `🍪 عدد الكوكيز: ${freshState.length}`,
        threadID,
        null,
        messageID
      );
    } catch (e) {
      api.sendMessage(`❌ فشل في تحديث الكوكيز: ${e.message}`, threadID, null, messageID);
    }
  },
};
