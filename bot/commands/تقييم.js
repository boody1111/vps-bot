const vm = require("vm");

module.exports = {
  name: "تقييم",
  aliases: ["eval", "run", "js"],
  description: "تشغيل كود JavaScript (مشرفون فقط)",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const code = args.join(" ");
    if (!code) return api.sendMessage("⚠️ الاستخدام: تقييم [كود JS]", threadID);
    const start = Date.now();
    try {
      const sandbox = {
        api, event, settings, state,
        require: (mod) => {
          const allowed = ["fs", "path", "os", "crypto", "util"];
          if (!allowed.includes(mod)) throw new Error(`الوحدة "${mod}" غير مسموح بها`);
          return require(mod);
        },
        console: { log: (...a) => result.logs.push(a.map(String).join(" ")) },
        setTimeout, clearTimeout, setInterval, clearInterval,
        process: { env: {}, uptime: process.uptime, version: process.version },
      };
      const result = { logs: [] };
      sandbox.console = { log: (...a) => result.logs.push(a.map(String).join(" ")) };
      const script = new vm.Script(code, { timeout: 5000 });
      const output = script.runInNewContext(sandbox, { timeout: 5000 });
      const elapsed = Date.now() - start;
      const out = output !== undefined ? String(output) : "(لا ناتج)";
      const logs = result.logs.length ? `\n📝 السجلات:\n${result.logs.join("\n")}` : "";
      api.sendMessage(
        `✅ تم التنفيذ (${elapsed}ms)\n━━━━━━━━━━━━━\n📤 الناتج:\n${out.slice(0, 1000)}${logs}`,
        threadID
      );
    } catch (e) {
      api.sendMessage(`❌ خطأ في التنفيذ:\n${e.message}`, threadID);
    }
  }
};
