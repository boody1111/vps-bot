const path = require("path");
const fs = require("fs");

module.exports = {
  name: "ريفرش",
  aliases: ["refresh", "reload", "تحديث_اوامر"],
  description: "إعادة تحميل ملفات الأوامر من القرص",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const { commands } = require("../handler");
    const COMMANDS_DIR = path.join(__dirname);
    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js"));
    let loaded = 0, failed = 0;
    for (const file of files) {
      const fp = path.join(COMMANDS_DIR, file);
      try {
        delete require.cache[require.resolve(fp)];
        const cmd = require(fp);
        if (cmd.name) {
          commands.set(cmd.name, cmd);
          if (cmd.aliases) cmd.aliases.forEach(a => commands.set(a, cmd));
          loaded++;
        }
      } catch (e) {
        console.error(`[REFRESH] ${file}:`, e.message);
        failed++;
      }
    }
    api.sendMessage(
      `🔄 تم تحديث الأوامر\n━━━━━━━━━━━━━\n✅ محمّل: ${loaded}\n❌ فشل: ${failed}\n📦 المجموع: ${commands.size} أمر`,
      threadID
    );
  }
};
