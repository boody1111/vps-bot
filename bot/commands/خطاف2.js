/**
 * خطاف 2 — Activity-aware smart scheduler
 *
 * Like خطاف (motor) but smarter:
 *   • Only sends if the group had recent activity (last ACTIVE_WINDOW_MS).
 *   • Uses a variable interval between minMs and maxMs to look human.
 *   • Reports last-activity status in حالة subcommand.
 *
 * Subcommands:
 *   خطاف2 رسالة [النص]      — set the message
 *   خطاف2 مين [وقت]         — set minimum interval
 *   خطاف2 ماكس [وقت]        — set maximum interval
 *   خطاف2 نشاط [دقائق]      — set activity window in minutes (default 45)
 *   خطاف2 تفعيل             — start smart scheduler
 *   خطاف2 ايقاف             — stop smart scheduler
 *   خطاف2 حالة              — show current status
 */

const ACTIVE_WINDOW_DEFAULT = 45 * 60 * 1000;

function parseTime(str) {
  if (!str) return null;
  const lower = str.toLowerCase();
  const num = parseFloat(lower);
  if (isNaN(num) || num <= 0) return null;
  if (lower.includes("دقيق") || lower.includes("م") || lower.endsWith("m")) {
    return num * 60 * 1000;
  }
  return num * 1000;
}

function formatMs(ms) {
  if (!ms) return "—";
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)} دقيقة`;
  return `${(ms / 1000).toFixed(0)} ثانية`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isGroupActive(threadID, windowMs) {
  const lastActivity = (global.lastThreadActivity || {})[threadID];
  if (!lastActivity) return false;
  return Date.now() - lastActivity < windowMs;
}

module.exports = {
  name: "خطاف2",
  description: "جدولة ذكية تراعي نشاط المجموعة — ترسل فقط عند وجود تفاعل حديث",
  usage: "خطاف2 رسالة [النص] | مين | ماكس | نشاط | تفعيل | ايقاف | حالة",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!state.scheduler2) state.scheduler2 = {};

    if (!action) {
      return api.sendMessage(
        `❓ خطاف 2 — المساعد الذكي:\n` +
          `${settings.prefix}خطاف2 رسالة [النص]\n` +
          `${settings.prefix}خطاف2 مين [الحد الأدنى]\n` +
          `${settings.prefix}خطاف2 ماكس [الحد الأقصى]\n` +
          `${settings.prefix}خطاف2 نشاط [دقائق الانتظار]\n` +
          `${settings.prefix}خطاف2 تفعيل\n` +
          `${settings.prefix}خطاف2 ايقاف\n` +
          `${settings.prefix}خطاف2 حالة`,
        threadID, null, messageID
      );
    }

    if (!state.scheduler2[threadID]) {
      state.scheduler2[threadID] = {
        active: false,
        message: null,
        minMs: null,
        maxMs: null,
        activeWindowMs: ACTIVE_WINDOW_DEFAULT,
        timerId: null,
      };
    }

    const s2 = state.scheduler2[threadID];

    if (action === "رسالة") {
      const msg = args.slice(1).join(" ");
      if (!msg) return api.sendMessage("⚠️ اكتب الرسالة بعد 'خطاف2 رسالة'.", threadID, null, messageID);
      s2.message = msg;
      return api.sendMessage(`✅ الرسالة: "${msg}"`, threadID, null, messageID);
    }

    if (action === "مين") {
      const ms = parseTime(args[1]);
      if (!ms) return api.sendMessage("⚠️ وقت غير صحيح. مثال: 30 أو 5م", threadID, null, messageID);
      s2.minMs = ms;
      return api.sendMessage(`✅ الحد الأدنى: ${formatMs(ms)}`, threadID, null, messageID);
    }

    if (action === "ماكس") {
      const ms = parseTime(args[1]);
      if (!ms) return api.sendMessage("⚠️ وقت غير صحيح. مثال: 60 أو 10م", threadID, null, messageID);
      s2.maxMs = ms;
      return api.sendMessage(`✅ الحد الأقصى: ${formatMs(ms)}`, threadID, null, messageID);
    }

    if (action === "نشاط") {
      const mins = parseFloat(args[1]);
      if (isNaN(mins) || mins <= 0) return api.sendMessage("⚠️ أدخل عدد الدقائق. مثال: 45", threadID, null, messageID);
      s2.activeWindowMs = mins * 60 * 1000;
      return api.sendMessage(`✅ نافذة النشاط: ${mins} دقيقة`, threadID, null, messageID);
    }

    if (action === "تفعيل") {
      if (!s2.message) return api.sendMessage("⚠️ لم تحدد الرسالة. استخدم: خطاف2 رسالة [النص]", threadID, null, messageID);
      if (!s2.minMs || !s2.maxMs) return api.sendMessage("⚠️ حدد الحد الأدنى والأقصى أولاً (مين / ماكس).", threadID, null, messageID);
      if (s2.minMs >= s2.maxMs) return api.sendMessage("⚠️ الحد الأدنى يجب أن يكون أصغر من الأقصى.", threadID, null, messageID);
      if (s2.active) return api.sendMessage("ℹ️ الخطاف 2 مفعّل بالفعل.", threadID, null, messageID);

      s2.active = true;
      if (!global.lastThreadActivity) global.lastThreadActivity = {};
      if (!global.lastThreadActivity[threadID]) global.lastThreadActivity[threadID] = Date.now();

      const loop = () => {
        if (!s2.active) return;
        const interval = randomInt(s2.minMs, s2.maxMs);

        s2.timerId = setTimeout(() => {
          if (!s2.active) return;

          if (!isGroupActive(threadID, s2.activeWindowMs)) {
            console.log(`[HOOK2] Thread ${threadID} inactive — skipping send.`);
            loop();
            return;
          }

          api.sendMessage(s2.message, threadID, () => { if (s2.active) loop(); });
        }, interval);
      };

      loop();

      return api.sendMessage(
        `✅ تم تفعيل الخطاف 2 الذكي!\n` +
          `📨 الرسالة: "${s2.message}"\n` +
          `⏱️ الفترة: ${formatMs(s2.minMs)} — ${formatMs(s2.maxMs)}\n` +
          `👁️ نافذة النشاط: ${Math.round(s2.activeWindowMs / 60000)} دقيقة\n` +
          `📌 يرسل فقط عند وجود نشاط حديث في المجموعة`,
        threadID, null, messageID
      );
    }

    if (action === "ايقاف") {
      if (!s2.active) return api.sendMessage("ℹ️ الخطاف 2 غير مفعّل أصلاً.", threadID, null, messageID);
      s2.active = false;
      if (s2.timerId) { clearTimeout(s2.timerId); s2.timerId = null; }
      return api.sendMessage("⏹️ تم إيقاف الخطاف 2.", threadID, null, messageID);
    }

    if (action === "حالة") {
      const lastActivity = (global.lastThreadActivity || {})[threadID];
      const idleMin = lastActivity ? Math.round((Date.now() - lastActivity) / 60000) : null;
      const activeLabel = isGroupActive(threadID, s2.activeWindowMs) ? "✅ نشطة" : "⏸️ هادئة";

      return api.sendMessage(
        `📊 حالة الخطاف 2 — ${threadID}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `الحالة: ${s2.active ? "✅ مفعّل" : "⏹️ موقوف"}\n` +
          `الرسالة: ${s2.message || "—"}\n` +
          `الفترة: ${formatMs(s2.minMs)} — ${formatMs(s2.maxMs)}\n` +
          `نشاط المجموعة: ${activeLabel}${idleMin !== null ? ` (آخر رسالة: ${idleMin}د)` : ""}\n` +
          `نافذة النشاط: ${Math.round((s2.activeWindowMs || ACTIVE_WINDOW_DEFAULT) / 60000)} دقيقة`,
        threadID, null, messageID
      );
    }

    api.sendMessage(`❓ أمر غير معروف. استخدم: ${settings.prefix}خطاف2 للمساعدة.`, threadID, null, messageID);
  },
};
