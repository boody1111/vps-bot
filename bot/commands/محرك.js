// Per-thread scheduler state
// state.scheduler[threadID] = { active, message, interval, intervalMs, timerId }

function parseTime(str) {
  // Accepts seconds or minutes: e.g. "30s", "5m", "30", "5دقائق", "30ثانية"
  if (!str) return null;
  const lower = str.toLowerCase();
  let num = parseFloat(lower);
  if (isNaN(num) || num <= 0) return null;

  if (lower.includes("دقيق") || lower.includes("م") || lower.endsWith("m")) {
    return num * 60 * 1000;
  }
  // Default: seconds
  return num * 1000;
}

function formatInterval(ms) {
  if (ms >= 60000) return `${ms / 60000} دقيقة`;
  return `${ms / 1000} ثانية`;
}

module.exports = {
  name: "خطاف",
  description: "يرسل رسالة تلقائية كل فترة زمنية محددة",
  usage: "خطاف رسالة [الرسالة] / خطاف وقت [الوقت] / خطاف تفعيل / خطاف ايقاف",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!action) {
      return api.sendMessage(
        `❓ الاستخدام:\n` +
          `${settings.prefix}خطاف رسالة [النص]\n` +
          `${settings.prefix}خطاف وقت [الوقت بالثواني أو الدقائق]\n` +
          `${settings.prefix}خطاف تفعيل\n` +
          `${settings.prefix}خطاف ايقاف`,
        threadID,
        null,
        messageID,
      );
    }

    // Initialize per-thread state
    if (!state.scheduler[threadID]) {
      state.scheduler[threadID] = {
        active: false,
        message: null,
        intervalMs: null,
        timerId: null,
      };
    }

    const sched = state.scheduler[threadID];

    if (action === "رسالة") {
      const msg = args.slice(1).join(" ");
      if (!msg) {
        return api.sendMessage(
          "⚠️ يرجى كتابة الرسالة بعد 'خطاف رسالة'.",
          threadID,
          null,
          messageID,
        );
      }
      sched.message = msg;
      api.sendMessage(
        `✅ تم تعيين الرسالة التلقائية:\n"${msg}"`,
        threadID,
        null,
        messageID,
      );
    } else if (action === "وقت") {
      const timeStr = args[1];
      const ms = parseTime(timeStr);
      if (!ms) {
        return api.sendMessage(
          "⚠️ وقت غير صحيح. أمثلة: 30 (ثانية) أو 5م (دقائق) أو 5دقائق",
          threadID,
          null,
          messageID,
        );
      }
      sched.intervalMs = ms;
      api.sendMessage(
        `✅ تم تعيين الفترة الزمنية: كل ${formatInterval(ms)}`,
        threadID,
        null,
        messageID,
      );
    } else if (action === "تفعيل") {
      if (!sched.message) {
        return api.sendMessage(
          "⚠️ لم يتم تعيين رسالة بعد. استخدم: خطاف رسالة [النص]",
          threadID,
          null,
          messageID,
        );
      }
      if (!sched.intervalMs) {
        return api.sendMessage(
          "⚠️ لم يتم تعيين الوقت بعد. استخدم: خطاف وقت [الوقت]",
          threadID,
          null,
          messageID,
        );
      }
      if (sched.active) {
        return api.sendMessage(
          "ℹ️ الخطاف مفعّل بالفعل.",
          threadID,
          null,
          messageID,
        );
      }

      sched.active = true;

      const sendLoop = () => {
        if (!sched.active) return;
        api.sendMessage(sched.message, threadID, () => {
          if (sched.active) {
            sched.timerId = setTimeout(sendLoop, sched.intervalMs);
          }
        });
      };

      sched.timerId = setTimeout(sendLoop, sched.intervalMs);
      api.sendMessage(
        `✅ تم تفعيل الخطاف.\n📨 الرسالة: "${sched.message}"\n⏱️ كل: ${formatInterval(sched.intervalMs)}`,
        threadID,
        null,
        messageID,
      );
    } else if (action === "ايقاف") {
      if (!sched.active) {
        return api.sendMessage(
          "ℹ️ الخطاف غير مفعّل أصلاً.",
          threadID,
          null,
          messageID,
        );
      }
      sched.active = false;
      if (sched.timerId) {
        clearTimeout(sched.timerId);
        sched.timerId = null;
      }
      api.sendMessage("⏹️ تم إيقاف الخطاف.", threadID, null, messageID);
    } else {
      api.sendMessage(
        `❓ الاستخدام:\n` +
          `${settings.prefix}خطاف رسالة [النص]\n` +
          `${settings.prefix}خطاف وقت [الوقت بالثواني أو الدقائق]\n` +
          `${settings.prefix}خطاف تفعيل\n` +
          `${settings.prefix}خطاف ايقاف`,
        threadID,
        null,
        messageID,
      );
    }
  },
};
