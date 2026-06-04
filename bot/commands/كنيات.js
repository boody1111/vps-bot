// Nickname protection per thread
// state.nicknames[threadID] = { active, nickname, intervalMs, timerId, participants, currentIndex }

const MIN_INTERVAL_MS = 5000; // never faster than 5s — avoids rate-limits

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

function formatInterval(ms) {
  if (ms >= 60000) return `${ms / 60000} دقيقة`;
  return `${ms / 1000} ثانية`;
}

module.exports = {
  name: "كنيات",
  description: "يحمي كنيات المجموعة ويضبطها على كنية موحدة",
  usage: "كنيات تفعيل [الكنية] / كنيات ايقاف / كنيات وقت [الوقت]",
  adminOnly: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!action) {
      return api.sendMessage(
        `❓ الاستخدام:\n` +
          `${settings.prefix}كنيات تفعيل [الكنية]\n` +
          `${settings.prefix}كنيات ايقاف\n` +
          `${settings.prefix}كنيات وقت [الوقت بالثواني أو الدقائق]`,
        threadID, null, messageID
      );
    }

    if (!state.nicknames[threadID]) {
      state.nicknames[threadID] = {
        active: false,
        nickname: null,
        intervalMs: 60 * 1000,
        timerId: null,
        participants: [],
        currentIndex: 0,
      };
    }

    const nick = state.nicknames[threadID];

    if (action === "تفعيل") {
      const nickname = args.slice(1).join(" ");
      if (!nickname) {
        return api.sendMessage(
          "⚠️ يرجى تحديد الكنية.\nمثال: كنيات تفعيل ⭐ نجمة",
          threadID, null, messageID
        );
      }

      // Stop any running loop before restarting (prevent double-loops)
      if (nick.timerId) {
        clearTimeout(nick.timerId);
        nick.timerId = null;
      }

      nick.nickname = nickname;
      nick.active = true;
      nick.currentIndex = 0;

      api.getThreadInfo(threadID, (err, info) => {
        if (err || !info) {
          nick.active = false;
          const reason = err ? (err.message || JSON.stringify(err)) : "لا توجد بيانات";
          return api.sendMessage(
            `❌ فشل في جلب معلومات المجموعة: ${reason}`,
            threadID, null, messageID
          );
        }

        // Prefer participantIDs array; fall back to userInfo object keys
        const raw = Array.isArray(info.participantIDs)
          ? info.participantIDs
          : Object.keys(info.userInfo || {});

        nick.participants = raw
          .map(String)
          .filter((id) => id !== String(api.getCurrentUserID()));

        if (nick.participants.length === 0) {
          nick.active = false;
          return api.sendMessage("⚠️ لا يوجد مشاركون في المجموعة.", threadID, null, messageID);
        }

        api.sendMessage(
          `✅ تم تفعيل حماية الكنيات\n🏷️ الكنية: "${nickname}"\n⏱️ كل: ${formatInterval(nick.intervalMs)}\n👥 المشاركون: ${nick.participants.length}`,
          threadID, null, messageID
        );

        startNicknameLoop(api, threadID, nick);
      });

    } else if (action === "ايقاف") {
      if (!nick.active && !nick.timerId) {
        return api.sendMessage("ℹ️ حماية الكنيات غير مفعّلة أصلاً.", threadID, null, messageID);
      }
      nick.active = false;
      if (nick.timerId) {
        clearTimeout(nick.timerId);
        nick.timerId = null;
      }
      api.sendMessage("⏹️ تم إيقاف حماية الكنيات.", threadID, null, messageID);

    } else if (action === "وقت") {
      const ms = parseTime(args[1]);
      if (!ms) {
        return api.sendMessage(
          "⚠️ وقت غير صحيح. أمثلة: 30 (ثانية) أو 5م (دقائق) أو 5دقائق",
          threadID, null, messageID
        );
      }
      const clamped = Math.max(ms, MIN_INTERVAL_MS);
      nick.intervalMs = clamped;

      if (nick.active && nick.timerId) {
        clearTimeout(nick.timerId);
        nick.timerId = null;
        startNicknameLoop(api, threadID, nick);
      }

      api.sendMessage(
        `✅ تم تعديل الفترة الزمنية: كل ${formatInterval(clamped)}`,
        threadID, null, messageID
      );

    } else {
      api.sendMessage(
        `❓ الاستخدام:\n` +
          `${settings.prefix}كنيات تفعيل [الكنية]\n` +
          `${settings.prefix}كنيات ايقاف\n` +
          `${settings.prefix}كنيات وقت [الوقت بالثواني أو الدقائق]`,
        threadID, null, messageID
      );
    }
  },
};

function startNicknameLoop(api, threadID, nick) {
  if (!nick.active || nick.participants.length === 0) return;

  const setNext = () => {
    if (!nick.active) return;

    const participantID = nick.participants[nick.currentIndex % nick.participants.length];
    nick.currentIndex++;

    api.changeNickname(nick.nickname, threadID, participantID, (err) => {
      if (err) {
        const msg = err.message || JSON.stringify(err);
        console.error(`[كنيات] changeNickname failed for ${participantID}: ${msg}`);

        // Permission / admin errors — stop the loop instead of hammering
        const fatalMsg = msg.toLowerCase();
        if (
          fatalMsg.includes("permission") ||
          fatalMsg.includes("admin") ||
          fatalMsg.includes("oc") ||
          fatalMsg.includes("blocked")
        ) {
          nick.active = false;
          nick.timerId = null;
          console.warn("[كنيات] Stopped — bot lacks permission to change nicknames in this thread.");
          return;
        }
      }

      if (nick.active) {
        nick.timerId = setTimeout(setNext, Math.max(nick.intervalMs, MIN_INTERVAL_MS));
      } else {
        nick.timerId = null;
      }
    });
  };

  nick.timerId = setTimeout(setNext, Math.max(nick.intervalMs, MIN_INTERVAL_MS));
}
