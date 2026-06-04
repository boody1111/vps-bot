const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const BAN_FILE = path.join(DATA_DIR, "ban.json");

function loadBans() {
  try {
    if (fs.existsSync(BAN_FILE)) return JSON.parse(fs.readFileSync(BAN_FILE, "utf8"));
  } catch {}
  return {};
}
function saveBans(data) {
  try { fs.writeFileSync(BAN_FILE, JSON.stringify(data, null, 2)); } catch {}
}

module.exports = {
  name: "ban",
  aliases: ["حظر", "بان"],
  description: "حظر مستخدم من استخدام البوت | فك الحظر | قائمة المحظورين",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, mentions, messageReply } = event;
    const bans = loadBans();

    if (args[0] === "قائمة" || args[0] === "list") {
      const list = Object.entries(bans).filter(([, v]) => v.banned);
      if (!list.length) return api.sendMessage("✅ لا يوجد مستخدمون محظورون.", threadID);
      return api.sendMessage(
        `🚫 المحظورون (${list.length}):\n` + list.map(([id, v]) => `• ${v.name || id}: ${v.reason || "—"}`).join("\n"),
        threadID
      );
    }

    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID || args[1];
    if (!targetID) return api.sendMessage("⚠️ الاستخدام: ban @مستخدم [السبب]\nأو: ban رفع @مستخدم\nأو: ban قائمة", threadID);

    if (args[0] === "رفع" || args[0] === "unban" || args[0] === "فك") {
      delete bans[targetID];
      saveBans(bans);
      return api.sendMessage(`✅ تم رفع الحظر عن المستخدم ${targetID}.`, threadID);
    }

    const reason = args.filter(a => !a.startsWith("@")).join(" ") || "لم يُذكر سبب";
    let name = targetID;
    try { const info = await api.getUserInfo(targetID); name = info?.[targetID]?.name || targetID; } catch {}
    bans[targetID] = { banned: true, name, reason, at: Date.now() };
    saveBans(bans);
    api.sendMessage(`🚫 تم حظر ${name}\n📝 السبب: ${reason}`, threadID);
  }
};
