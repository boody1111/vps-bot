const os = require("os");

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} يوم`);
  if (h > 0) parts.push(`${h} ساعة`);
  if (m > 0) parts.push(`${m} دقيقة`);
  parts.push(`${s} ثانية`);
  return parts.join(" و ");
}

function formatBytes(bytes) {
  const gb = bytes / (1024 ** 3);
  const mb = bytes / (1024 ** 2);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
}

module.exports = {
  name: "ابتيم",
  description: "يعرض معلومات النظام ووقت تشغيل البوت",
  adminOnly: false,

  execute(api, event, args, settings, state) {
    const uptimeSec = process.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : "غير معروف";
    const cpuCores = cpus.length;

    const platform = os.platform();
    const arch = os.arch();
    const osType = os.type();

    const loadAvg = os.loadavg();

    const msg =
      `⚙️ معلومات النظام:\n\n` +
      `⏱️ وقت التشغيل: ${formatUptime(uptimeSec)}\n` +
      `🖥️ النظام: ${osType} (${platform} ${arch})\n` +
      `💻 المعالج: ${cpuModel}\n` +
      `🔧 عدد الأنوية: ${cpuCores}\n` +
      `📊 تحميل المعالج (1/5/15 دقيقة): ${loadAvg[0].toFixed(2)} / ${loadAvg[1].toFixed(2)} / ${loadAvg[2].toFixed(2)}\n` +
      `🧠 الذاكرة المستخدمة: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n` +
      `💾 الذاكرة الحرة: ${formatBytes(freeMem)}\n` +
      `🟢 بيئة Node.js: ${process.version}`;

    api.sendMessage(msg, event.threadID, null, event.messageID);
  },
};
