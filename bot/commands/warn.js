const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const WARN_FILE = path.join(DATA_DIR, "warn.json");

function loadWarns() {
  try { if (fs.existsSync(WARN_FILE)) return JSON.parse(fs.readFileSync(WARN_FILE, "utf8")); } catch {}
  return {};
}
function saveWarns(data) {
  try { fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2)); } catch {}
}

module.exports = {
  name: "warn",
  aliases: ["تحذير", "انذار"],
  description: "تحذير عضو — 3 تحذيرات = طرد",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID, mentions, messageReply } = event;
    const warns = loadWarns();
    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID || args[0];
    if (!targetID) return api.sendMessage("⚠️ الاستخدام: warn @مستخدم [السبب]\nأو: warn reset @مستخدم\nأو: warn قائمة", threadID);

    if (args[0] === "قائمة" || args[0] === "list") {
      const list = Object.entries(warns[threadID] || {});
      if (!list.length) return api.sendMessage("✅ لا يوجد تحذيرات في هذه المجموعة.", threadID);
      return api.sendMessage(
        `⚠️ التحذيرات:\n` + list.map(([id, v]) => `• ${v.name || id}: ${v.count}/3`).join("\n"),
        threadID
      );
    }

    if (args[0] === "reset" || args[0] === "إعادة") {
      if (warns[threadID]) delete warns[threadID][targetID];
      saveWarns(warns);
      return api.sendMessage(`✅ تم إعادة ضبط تحذيرات ${targetID}.`, threadID);
    }

    if (!warns[threadID]) warns[threadID] = {};
    if (!warns[threadID][targetID]) warns[threadID][targetID] = { count: 0, name: targetID };

    warns[threadID][targetID].count++;
    const count = warns[threadID][targetID].count;
    const reason = mentionIDs.length ? args.join(" ") : args.slice(1).join(" ") || "لم يُذكر سبب";

    let name = targetID;
    try { const info = await api.getUserInfo(targetID); name = info?.[targetID]?.name || targetID; warns[threadID][targetID].name = name; } catch {}
    saveWarns(warns);

    if (count >= 3) {
      try { await api.removeUserFromGroup(targetID, threadID); } catch {}
      return api.sendMessage(`🚫 ${name} وصل لـ 3 تحذيرات وتم طرده!\n📝 ${reason}`, threadID);
    }

    api.sendMessage(
      `⚠️ تحذير لـ ${name} (${count}/3)\n📝 السبب: ${reason}\n${count === 2 ? "⚠️ تحذير أخير قبل الطرد!" : ""}`,
      threadID
    );
  }
};
