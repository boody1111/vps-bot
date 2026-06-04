const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const AI_USERS_PATH = path.join(DATA_DIR, "ai-users.json");

function load() {
  try { if (fs.existsSync(AI_USERS_PATH)) return JSON.parse(fs.readFileSync(AI_USERS_PATH, "utf8")); } catch {}
  return { users: [] };
}
function save(d) { try { fs.writeFileSync(AI_USERS_PATH, JSON.stringify(d, null, 2)); } catch {} }

module.exports = {
  name: "شخصية",
  aliases: ["personality", "ai_user", "شخص"],
  description: "إدارة قاعدة بيانات شخصيات المستخدمين للذكاء الاصطناعي",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID, mentions, messageReply } = event;
    const sub = args[0];
    const data = load();

    if (!sub || sub === "قائمة" || sub === "list") {
      if (!data.users?.length) return api.sendMessage("📋 لا توجد شخصيات مضافة.", threadID);
      const lines = data.users.map((u, i) =>
        `${i + 1}. ${u.name || "مجهول"} (${(u.ids || []).join(", ")})\n   ${u.description || ""}`
      );
      return api.sendMessage(`📋 الشخصيات (${data.users.length}):\n━━━━━━━━━━━━━\n${lines.join("\n")}`, threadID);
    }

    if (sub === "اضافة" || sub === "add") {
      const mentionIDs = Object.keys(mentions || {});
      const targetID = mentionIDs[0] || messageReply?.senderID;
      const name = args.slice(mentionIDs.length ? 1 : 2).join(" ") || "مجهول";
      if (!targetID) return api.sendMessage("⚠️ منشن المستخدم.", threadID);
      if (!data.users) data.users = [];
      const existing = data.users.find(u => (u.ids || []).includes(targetID));
      if (existing) return api.sendMessage("⚠️ هذا المستخدم موجود بالفعل.", threadID);
      data.users.push({ name, ids: [targetID], description: "" });
      save(data);
      return api.sendMessage(`✅ تمت إضافة شخصية: ${name}`, threadID);
    }

    if (sub === "حذف" || sub === "remove") {
      const mentionIDs = Object.keys(mentions || {});
      const targetID = mentionIDs[0] || messageReply?.senderID;
      if (!targetID) return api.sendMessage("⚠️ منشن المستخدم.", threadID);
      data.users = (data.users || []).filter(u => !(u.ids || []).includes(targetID));
      save(data);
      return api.sendMessage("✅ تم حذف الشخصية.", threadID);
    }

    api.sendMessage("⚠️ الاستخدام:\n• شخصية قائمة\n• شخصية اضافة @مستخدم [اسم]\n• شخصية حذف @مستخدم", threadID);
  }
};
