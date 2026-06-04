const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const FILE = path.join(DATA_DIR, "repeat-names.json");

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
  return {};
}
function save(d) { try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch {} }

if (!global.repeatName) global.repeatName = load();

module.exports = {
  name: "تكرار",
  aliases: ["namelock", "name_protect"],
  description: "حماية اسم المجموعة — يستعيده فور تغييره",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sub = args[0];
    const data = global.repeatName || (global.repeatName = load());

    if (sub === "تفعيل" || sub === "on") {
      const customName = args.slice(1).join(" ");
      if (!customName) {
        return api.getThreadInfo(threadID, (err, info) => {
          if (err) return api.sendMessage("❌ فشل جلب معلومات المجموعة.", threadID);
          const name = info.threadName || info.name;
          data[threadID] = { status: true, name };
          save(data);
          api.sendMessage(`✅ تم تفعيل حماية الاسم: "${name}"`, threadID);
        });
      }
      data[threadID] = { status: true, name: customName };
      save(data);
      return api.sendMessage(`✅ تم تفعيل حماية الاسم: "${customName}"`, threadID);
    }
    if (sub === "ايقاف" || sub === "off") {
      if (data[threadID]) data[threadID].status = false;
      save(data);
      return api.sendMessage("❌ تم إيقاف حماية الاسم.", threadID);
    }

    const entry = data[threadID];
    const statusText = entry?.status ? `✅ مفعّل — الاسم: "${entry.name}"` : "❌ غير مفعّل";
    api.sendMessage(`🔒 حماية الاسم: ${statusText}\n\nالأوامر: تكرار تفعيل [اسم اختياري] | ايقاف`, threadID);
  }
};
