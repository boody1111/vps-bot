'use strict';
const fs   = require("fs");
const path = require("path");

const DATA_DIR  = process.env.BOT_DIR || path.join(__dirname, '..');
const DATA_FILE = path.join(DATA_DIR, 'angelData.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (_) {}
  return {};
}

function saveData(data) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch (_) {}
}

function getIntervals() {
  if (!global.angelIntervals) global.angelIntervals = {};
  return global.angelIntervals;
}

function restoreIntervals(api, data) {
  if (global._angelRestored) return;
  global._angelRestored = true;
  const intervals = getIntervals();
  let restored = 0;
  for (const [threadID, td] of Object.entries(data)) {
    if (td.active && td.message && !intervals[threadID]) {
      const ms = (td.intervalMinutes || 10) * 60_000;
      intervals[threadID] = setInterval(() => {
        try { api.sendMessage(td.message, threadID); } catch (_) {}
      }, ms);
      restored++;
    }
  }
  if (restored > 0) console.log(`[ANGEL] ✅ Restored ${restored} auto-send interval(s).`);
}

module.exports = {
  name: "angel",
  aliases: ["انجل", "auto-send"],
  description: "إرسال تلقائي متكرر في المجموعة بفاصل زمني محدد",
  adminOnly: true,

  execute(api, event, args, settings) {
    const { threadID, messageID } = event;
    const data = loadData();

    restoreIntervals(api, data);

    if (!data[threadID]) data[threadID] = { message: null, intervalMinutes: 10, active: false };
    const td        = data[threadID];
    const intervals = getIntervals();
    const sub       = (args[0] || '').toLowerCase();

    switch (sub) {
      case 'change':
      case 'تغيير': {
        const newMsg = args.slice(1).join(' ').trim();
        if (!newMsg)
          return api.sendMessage('❌ اكتب الرسالة بعد الأمر.\nمثال: angel change مرحباً!', threadID, messageID);
        td.message = newMsg;
        saveData(data);
        return api.sendMessage(`✅ تم تحديث الرسالة!\n📝 "${newMsg}"`, threadID, messageID);
      }

      case 'time':
      case 'وقت': {
        const mins = parseFloat(args[1]);
        if (isNaN(mins) || mins <= 0)
          return api.sendMessage('❌ اكتب عدد الدقائق.\nمثال: angel time 10', threadID, messageID);
        td.intervalMinutes = mins;
        saveData(data);
        if (intervals[threadID]) {
          clearInterval(intervals[threadID]);
          delete intervals[threadID];
          if (td.message && td.active) {
            intervals[threadID] = setInterval(() => {
              try { api.sendMessage(td.message, threadID); } catch (_) {}
            }, mins * 60_000);
          }
        }
        return api.sendMessage(
          `✅ تم تحديث الفاصل الزمني!\n⏱️ كل ${mins} دقيقة` +
          (td.active ? '\n♻️ تم إعادة تشغيله بالفاصل الجديد.' : ''),
          threadID, messageID
        );
      }

      case 'on':
      case 'تشغيل': {
        if (!td.message)
          return api.sendMessage('❌ اضبط الرسالة أولاً:\nangel change [رسالتك]', threadID, messageID);
        if (intervals[threadID])
          return api.sendMessage('⚠️ الإرسال التلقائي مُفعَّل مسبقاً في هذه المجموعة.', threadID, messageID);
        td.active = true;
        saveData(data);
        const ms = td.intervalMinutes * 60_000;
        intervals[threadID] = setInterval(() => {
          try { api.sendMessage(td.message, threadID); } catch (_) {}
        }, ms);
        return api.sendMessage(
          `✅ تم تفعيل الإرسال التلقائي!\n\n📝 "${td.message}"\n⏱️ كل ${td.intervalMinutes} دقيقة`,
          threadID, messageID
        );
      }

      case 'off':
      case 'إيقاف': {
        if (!intervals[threadID])
          return api.sendMessage('⚠️ الإرسال التلقائي غير مُفعَّل في هذه المجموعة.', threadID, messageID);
        clearInterval(intervals[threadID]);
        delete intervals[threadID];
        td.active = false;
        saveData(data);
        return api.sendMessage('✅ تم إيقاف الإرسال التلقائي.', threadID, messageID);
      }

      case 'status':
      case 'حالة': {
        const isRunning = !!intervals[threadID];
        return api.sendMessage(
          `📊 حالة Angel — هذه المجموعة\n\n` +
          `▪️ الحالة: ${isRunning ? '🟢 يعمل' : '🔴 موقوف'}\n` +
          `▪️ الرسالة: ${td.message ? `"${td.message}"` : 'لم تُضبط'}\n` +
          `▪️ الفاصل: ${td.intervalMinutes} دقيقة`,
          threadID, messageID
        );
      }

      default: {
        return api.sendMessage(
          '📖 أوامر Angel:\n\n' +
          'angel change [رسالة] — ضبط الرسالة\n' +
          'angel time [دقائق]   — ضبط الفاصل\n' +
          'angel on             — تفعيل الإرسال\n' +
          'angel off            — إيقاف الإرسال\n' +
          'angel status         — عرض الحالة',
          threadID, messageID
        );
      }
    }
  },
};
