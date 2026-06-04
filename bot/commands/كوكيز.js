const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.BOT_DIR || path.join(__dirname, "..");
const APPSTATE_PATH = path.join(DATA_DIR, "appstate.json");
const ALT_PATH = path.join(DATA_DIR, "alt.json");

module.exports = {
  name: "كوكيز",
  aliases: ["cookie"],
  description: "تحديث ملفات الكوكيز من الجلسة الحالية",
  usage: "كوكيز",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;

    api.sendMessage("🔄 جارٍ تحديث الكوكيز...", threadID, null, messageID);

    try {
      const freshState = api.getAppState();

      if (!freshState || freshState.length === 0) {
        return api.sendMessage("❌ فشل: الجلسة فارغة أو غير صالحة.", threadID, null, messageID);
      }

      fs.writeFileSync(APPSTATE_PATH, JSON.stringify(freshState, null, 2), "utf8");
      fs.writeFileSync(ALT_PATH, JSON.stringify(freshState, null, 2), "utf8");

      const userID = api.getCurrentUserID();
      const cookieCount = freshState.length;

      api.sendMessage(
        `✅ تم تحديث الكوكيز بنجاح!\n` +
        `🆔 المعرف: ${userID}\n` +
        `🍪 عدد الكوكيز: ${cookieCount}\n` +
        `🕒 الوقت: ${new Date().toLocaleString("ar")}`,
        threadID, null, messageID
      );

      console.log(`[COOKIES] Cookies refreshed manually by admin. Count: ${cookieCount}`);
    } catch (e) {
      console.error("[COOKIES] Failed to refresh cookies:", e.message);
      api.sendMessage(`❌ فشل في تحديث الكوكيز: ${e.message}`, threadID, null, messageID);
    }
  },
};
