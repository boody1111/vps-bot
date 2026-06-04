'use strict';
const fs   = require("fs");
const path = require("path");
const { registerReplyHandler } = require("../handler");

// ─── Bold Unicode digits ───────────────────────────────────────────────────────
const BD = ['𝟎','𝟏','𝟐','𝟑','𝟒','𝟓','𝟔','𝟕','𝟖','𝟗'];
function toBold(n) {
  return String(n).split('').map(c => /\d/.test(c) ? BD[+c] : c).join('');
}

// ─── Bot name / header ─────────────────────────────────────────────────────────
const HEADER = `𖣴 ͓∢ 𝐍𝛆⃪ິ̶︭̙𝚡̷̶͇𝖚̶𝐬̶̷︭̙ ⥽ 🧲  𖣴 𝕭ິ︩︪𝐨̸ȶ 🪭`;

// ─── 10 ordered category slots ────────────────────────────────────────────────
const CAT_ORDER = [
  ['إدارة البوت',    '🪭'],
  ['إدارة المجموعة', '☕'],
  ['نظام',           '⚖️'],
  ['أدوات',          '🪙'],
  ['ألعاب',          '🕸'],
  ['ترفيه',          '🪶'],
  ['ذكاء اصطناعي',  '🧲'],
  ['ميديا',          '☢️'],
  ['معلومات',        '🪅'],
  ['مطور',           '🧬'],
];

const CAT_EMOJI = new Map(CAT_ORDER);

// ─── Command → Category map ────────────────────────────────────────────────────
const CATEGORY_MAP = {
  // إدارة البوت
  'ادمن':'إدارة البوت','admins':'إدارة البوت','قفل':'إدارة البوت',
  'lockdown':'إدارة البوت','ريفرش':'إدارة البوت','cookie':'إدارة البوت',
  'كوكيز':'إدارة البوت','shutdown':'إدارة البوت','رست':'إدارة البوت',
  // إدارة المجموعة
  'nm':'إدارة المجموعة','كنيات':'إدارة المجموعة','groupname':'إدارة المجموعة',
  'تنظيف':'إدارة المجموعة','kick':'إدارة المجموعة','ban':'إدارة المجموعة',
  'warn':'إدارة المجموعة','gcadmin':'إدارة المجموعة','antiout':'إدارة المجموعة',
  'out':'إدارة المجموعة','badwords':'إدارة المجموعة','تصويت':'إدارة المجموعة',
  'صوّت':'إدارة المجموعة','تثبيت':'إدارة المجموعة',
  // نظام
  'حماية':'نظام','صامت':'نظام',
  // أدوات
  'pp':'أدوات','qrgen':'أدوات','tempmail':'أدوات','unsend':'أدوات',
  'ترجم':'أدوات','تكرار':'أدوات','ثنائي':'أدوات','حاسبة':'أدوات',
  'ذكرني':'أدوات','طقس_مدينة':'أدوات','عد':'أدوات','عملة':'أدوات',
  'كتلة_جسم':'أدوات','مؤقت':'أدوات','محرك':'أدوات','موتور2':'أدوات',
  'هاش':'أدوات','تاريخ':'أدوات','سريع':'أدوات','صدى':'أدوات',
  'بحث_عضو':'أدوات','خطاف':'أدوات','خطاف2':'أدوات','angel':'أدوات',
  // ألعاب
  'pair':'ألعاب','slot':'ألعاب','اكس':'ألعاب','كرة8':'ألعاب',
  'كلمة':'ألعاب','كلمة_سر':'ألعاب','نرد':'ألعاب','حظ':'ألعاب',
  'حقيقة':'ألعاب','خمن':'ألعاب','دايفل':'ألعاب','صراحة':'ألعاب','صواب_خطأ':'ألعاب',
  // ترفيه
  'تقييم':'ترفيه','عشوائي':'ترفيه','قصر':'ترفيه','شخصية':'ترفيه',
  // ذكاء اصطناعي
  'اصنع':'ذكاء اصطناعي',
  // ميديا
  'imgen':'ميديا','song':'ميديا','بطاقة':'ميديا','بنترست':'ميديا',
  'تيكتوك':'ميديا','جلب':'ميديا','صورة':'ميديا',
  // معلومات
  'بينغ':'معلومات','ابتيم':'معلومات','اوامر':'معلومات','احصائيات':'معلومات',
  'اعلام':'معلومات','بروفايل':'معلومات','حسابات':'معلومات','معرف':'معلومات',
  'معلومات':'معلومات','أصدقاء':'معلومات',
  // مطور
  'تست':'مطور','نيكسس':'مطور','نيكسسفان':'مطور',
};

const DEFAULT_CAT = 'أدوات';

function catEmoji(name) { return CAT_EMOJI.get(name) || '🔧'; }
function catIndex(name) {
  const i = CAT_ORDER.findIndex(([n]) => n === name);
  return i >= 0 ? i + 1 : 99;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadCmdMap() {
  const dir   = path.join(__dirname);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  const map   = new Map();
  const seen  = new Set();
  for (const f of files) {
    try {
      const cmd = require(path.join(dir, f));
      if (!cmd.name || !cmd.description || seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      map.set(cmd.name, cmd);
    } catch {}
  }
  return map;
}

function buildCats(cmdMap) {
  const cats = new Map();
  for (const [name, cmd] of cmdMap.entries()) {
    const cat = CATEGORY_MAP[name] || DEFAULT_CAT;
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat).push({ name, cmd });
  }
  return cats;
}

function sortedCats(cats) {
  const ordered = CAT_ORDER.map(([n]) => n);
  return [
    ...ordered.filter(n => cats.has(n)),
    ...[...cats.keys()].filter(n => !ordered.includes(n)),
  ];
}

// ─── Command ───────────────────────────────────────────────────────────────────
module.exports = {
  name: "اوامر",
  aliases: ["help","cmds","commands","أوامر","الاوامر","helpme"],
  description: "عرض قائمة الأوامر المتاحة مع التصنيف",
  adminOnly: false,

  execute(api, event, args, settings) {
    const { threadID, messageID, senderID } = event;
    const P      = settings?.prefix || '/';
    const cmdMap = loadCmdMap();

    if (cmdMap.size === 0)
      return api.sendMessage('⚠️ لم تُحمَّل الأوامر بعد. انتظر لحظة.', threadID, messageID);

    const cats  = buildCats(cmdMap);
    const total = cmdMap.size;

    // ── اوامر أمر [name] ── command details ──────────────────────────────────
    if (args[0] === 'أمر' || args[0] === 'cmd' || args[0] === 'info') {
      const search = args.slice(1).join(' ').toLowerCase();
      if (!search) return api.sendMessage(`ℹ️ مثال: ${P}اوامر أمر بينغ`, threadID, messageID);
      let found = null;
      for (const [name, cmd] of cmdMap.entries()) {
        const ali = (cmd.aliases || []).map(a => a.toLowerCase());
        if (name.toLowerCase() === search || ali.includes(search)) { found = { name, cmd }; break; }
      }
      if (!found)
        return api.sendMessage(`❌ الأمر "${args.slice(1).join(' ')}" غير موجود.`, threadID, messageID);
      const { name, cmd } = found;
      const cat   = CATEGORY_MAP[name] || DEFAULT_CAT;
      const emoji = catEmoji(cat);
      const lines = [
        HEADER, '',
        `📋 ${P}${name}`,
        `📝 الوصف: ${cmd.description || '—'}`,
        `🏷️ الفئة: ${cat} ${emoji}`,
        cmd.adminOnly ? '🔒 للمشرفين فقط' : '👥 للجميع',
      ];
      if (cmd.aliases?.length) lines.push(`🔗 البدائل: ${cmd.aliases.join(', ')}`);
      return api.sendMessage(lines.join('\n'), threadID, messageID);
    }

    // ── اوامر [category or number] ── filter ─────────────────────────────────
    if (args.length > 0) {
      const query = args.join(' ').toLowerCase().trim();
      const num   = parseInt(query, 10);
      let matchedCat = null;

      if (!isNaN(num) && num >= 1 && num <= CAT_ORDER.length)
        matchedCat = CAT_ORDER[num - 1][0];

      if (!matchedCat) {
        for (const cat of cats.keys()) {
          if (cat.toLowerCase().includes(query) || query.includes(cat.toLowerCase())) {
            matchedCat = cat; break;
          }
        }
      }

      if (matchedCat && cats.has(matchedCat)) {
        const cmds  = cats.get(matchedCat) || [];
        const emoji = catEmoji(matchedCat);
        const idx   = catIndex(matchedCat);
        const lines = [
          HEADER, '',
          `≼${toBold(idx)}≽ ⥽ ꐾ̷̷̸'ິ ${toBold(cmds.length)} ↴̶ — ${matchedCat} ໋${emoji}`,
          '',
          ...cmds.map(({ name, cmd }) => `  • ${P}${name}${cmd.adminOnly ? ' 🔒' : ''}`),
          '',
          `💡 ${P}اوامر أمر [اسم] — لتفاصيل أمر`,
        ];
        return api.sendMessage(lines.join('\n'), threadID, messageID);
      }

      // Search by command name
      const matches = [...cmdMap.keys()].filter(n => n.toLowerCase().includes(query));
      if (matches.length > 0) {
        return api.sendMessage(
          `${HEADER}\n\n🔎 نتائج "${args.join(' ')}" (${toBold(matches.length)}):\n\n` +
          matches.map(n => `  • ${P}${n}`).join('\n'),
          threadID, messageID
        );
      }
      return api.sendMessage(`❌ لا توجد أوامر أو فئة تطابق "${args.join(' ')}".`, threadID, messageID);
    }

    // ── Full list — categories only ───────────────────────────────────────────
    const sorted = sortedCats(cats);
    const lines  = [];

    for (const catName of sorted) {
      const cmds = cats.get(catName) || [];
      if (!cmds.length) continue;
      const emoji = catEmoji(catName);
      const idx   = catIndex(catName);
      lines.push(`≼${toBold(idx)}≽ ${emoji} ${catName} — ${toBold(cmds.length)} أمر`);
    }

    const footer =
      `\n📊 ${toBold(total)} أمر · ${toBold(cats.size)} فئة` +
      `\n\n💡 أرسل رقم الفئة لعرض أوامرها` +
      `\n💡 ${P}اوامر أمر [اسم] — تفاصيل أمر`;

    api.sendMessage(
      HEADER + '\n\n' + lines.join('\n') + footer,
      threadID,
      (err) => {
        if (err) return;
        registerReplyHandler(threadID, senderID, (api2, ev2, settings2) => {
          const body = (ev2.body || '').trim();
          const n = parseInt(body, 10);
          if (isNaN(n) || n < 1 || n > CAT_ORDER.length) return;
          const catName = CAT_ORDER[n - 1][0];
          const cats2 = buildCats(loadCmdMap());
          if (!cats2.has(catName)) return;
          const cmds2 = cats2.get(catName) || [];
          const emoji2 = catEmoji(catName);
          const idx2   = catIndex(catName);
          const P2     = settings2?.prefix || '/';
          const lines2 = [
            HEADER, '',
            `≼${toBold(idx2)}≽ ⥽ ꐾ̷̷̸'ິ ${toBold(cmds2.length)} ↴̶ — ${catName} ໋${emoji2}`,
            '',
            ...cmds2.map(({ name, cmd }) => `  • ${P2}${name}${cmd.adminOnly ? ' 🔒' : ''}`),
            '',
            `💡 ${P2}اوامر أمر [اسم] — لتفاصيل أمر`,
          ];
          api2.sendMessage(lines2.join('\n'), ev2.threadID, null, ev2.messageID);
        }, 60000);
      },
      messageID
    );
  },
};
