const os = require("os");

function fmtUptime(sec) {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return `${d}ي ${h}س ${m}د`;
}

module.exports = {
  name: "معلومات",
  aliases: ["info", "about", "botinfo"],
  description: "معلومات تفصيلية عن البوت والخادم",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const mem = process.memoryUsage();
    const cpus = os.cpus();
    const platform = os.platform();
    const arch = os.arch();
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
    const usedHeap = (mem.heapUsed / 1024 / 1024).toFixed(1);

    api.sendMessage(
      `🤖 معلومات البوت\n━━━━━━━━━━━━━\n` +
      `📛 الاسم: ${settings.botName || "Nexus"}\n` +
      `⏱ التشغيل: ${fmtUptime(process.uptime())}\n` +
      `🔑 النظام: Node.js ${process.version}\n` +
      `━━━━━━━━━━━━━\n` +
      `💻 الخادم\n` +
      `🖥 النظام: ${platform} (${arch})\n` +
      `⚙️ المعالج: ${cpus[0]?.model?.slice(0, 25)} (×${cpus.length})\n` +
      `💾 RAM: ${freeMem}GB حرة / ${totalMem}GB\n` +
      `📦 Heap: ${usedHeap}MB\n` +
      `━━━━━━━━━━━━━\n` +
      `🔒 مقفل: ${state.locked ? "نعم" : "لا"}\n` +
      `🛡 الحمايات: P1-P18 ✅`,
      threadID
    );
  }
};
