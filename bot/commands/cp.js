'use strict';
/**
 * cp.js — لوحة التحكم (Control Panel)
 * Compatible with: sainxsain/Nexus
 */

const HEADER = `𖣴 ͓∢ 𝐍𝛆⃪ິ̶︭̙𝚡̷̶͇𝖚̶𝐬̶̷︭̙ ⥽ 🧲  𖣴 𝕭ິ︩︪𝐨̸ȶ 🪭`;

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}ي ${h % 24}س`;
  if (h > 0) return `${h}س ${m % 60}د`;
  return `${m}د ${s % 60}ث`;
}

function buildMainMenu(state, settings, uptime) {
  const P = settings?.prefix || '/';
  const lines = [
    HEADER,
    '',
    '🎛️ لوحة التحكم — اختر رقماً:',
    '',
    `1️⃣  حالة البوت       — ${state.locked ? '🔒 مقفل' : '✅ نشط'}`,
    `2️⃣  قفل الاسم        — ${state.nameLock?.active ? `🟢 ${state.nameLock.name || '—'}` : '🔴 متوقف'}`,
    `3️⃣  الخطافات          — ${Object.values(state.scheduler || {}).filter(s => s.active).length} نشط`,
    `4️⃣  حماية الكنيات    — ${Object.values(state.nicknames || {}).filter(s => s.active).length} نشط`,
    `5️⃣  تبديل القفل       — ${state.locked ? 'فتح البوت' : 'قفل البوت'}`,
    '',
    `⏱️ وقت التشغيل: ${uptime}`,
    `📌 البادئة: ${P}`,
    '',
    '💡 أرسل الرقم للتفاصيل، أو أي شيء آخر للإغلاق.',
  ];
  return lines.join('\n');
}

module.exports = {
  name: 'cp',
  aliases: ['panel', 'لوحة', 'control'],
  description: 'لوحة تحكم تفاعلية بالبوت',
  usage: 'cp',
  adminOnly: true,
  prefix: true,

  execute(api, event, args, settings, state) {
    const { threadID, messageID, senderID } = event;

    const uptime = state?._startedAt
      ? formatUptime(Date.now() - state._startedAt)
      : '—';

    const menu = buildMainMenu(state || {}, settings, uptime);

    api.sendMessage(menu, threadID, (err, info) => {
      if (err || !info) return;

      const { registerReplyHandler } = require('../handler');
      registerReplyHandler(threadID, senderID, (api2, ev2, settings2) => {
        const choice = (ev2.body || '').trim();
        const s = state || {};
        const P = settings2?.prefix || '/';

        switch (choice) {
          case '1': {
            const up2 = s._startedAt ? formatUptime(Date.now() - s._startedAt) : '—';
            const lines = [
              HEADER, '',
              '📊 *حالة البوت*', '',
              `● الحالة: ${s.locked ? '🔒 مقفل' : '✅ يعمل'}`,
              `● وقت التشغيل: ${up2}`,
              `● قفل الاسم: ${s.nameLock?.active ? `🟢 (${s.nameLock.name || '—'})` : '🔴 متوقف'}`,
              `● خطافات نشطة: ${Object.values(s.scheduler || {}).filter(x => x.active).length}`,
              `● كنيات نشطة: ${Object.values(s.nicknames || {}).filter(x => x.active).length}`,
            ];
            api2.sendMessage(lines.join('\n'), ev2.threadID, ev2.messageID);
            break;
          }
          case '2': {
            const nl = s.nameLock || {};
            const lines = [
              HEADER, '',
              '📛 *قفل الاسم*', '',
              `● الحالة: ${nl.active ? '🟢 نشط' : '🔴 متوقف'}`,
              `● الاسم: ${nl.name || '—'}`,
              `● المجموعة: ${nl.threadId || '—'}`,
              '',
              `💡 ${P}nm start <tid> <اسم> — لتفعيله`,
              `💡 ${P}nm stop — لإيقافه`,
            ];
            api2.sendMessage(lines.join('\n'), ev2.threadID, ev2.messageID);
            break;
          }
          case '3': {
            const hooks = Object.entries(s.scheduler || {});
            const active = hooks.filter(([, v]) => v.active);
            const lines = [HEADER, '', `⚓ *الخطافات (${active.length}/${hooks.length})*`, ''];
            if (active.length === 0) {
              lines.push('لا توجد خطافات نشطة.');
            } else {
              for (const [tid, h] of active) {
                lines.push(`● ${tid}: كل ${Math.round((h.intervalMs || 0) / 1000)}ث — "${(h.message || '').slice(0, 30)}"`);
              }
            }
            lines.push('', `💡 ${P}خطاف start / stop`);
            api2.sendMessage(lines.join('\n'), ev2.threadID, ev2.messageID);
            break;
          }
          case '4': {
            const nicks = Object.entries(s.nicknames || {});
            const active = nicks.filter(([, v]) => v.active);
            const lines = [HEADER, '', `🏷️ *حماية الكنيات (${active.length}/${nicks.length})*`, ''];
            if (active.length === 0) {
              lines.push('لا توجد حماية كنيات نشطة.');
            } else {
              for (const [tid, n] of active) {
                lines.push(`● ${tid}: "${n.nickname || '—'}"`);
              }
            }
            lines.push('', `💡 ${P}كنيات start / stop`);
            api2.sendMessage(lines.join('\n'), ev2.threadID, ev2.messageID);
            break;
          }
          case '5': {
            if (s.locked !== undefined) s.locked = !s.locked;
            api2.sendMessage(
              `${HEADER}\n\n${s.locked ? '🔒 تم قفل البوت.' : '🔓 تم فتح البوت.'}`,
              ev2.threadID, ev2.messageID
            );
            break;
          }
          default:
            api2.sendMessage(`${HEADER}\n\n✅ تم إغلاق لوحة التحكم.`, ev2.threadID, ev2.messageID);
        }
      }, 60000);
    }, messageID);
  },
};
