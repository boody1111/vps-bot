import { useEffect, useRef, useState } from "react";
import {
  useBotStatus, useBotLogs, useBotSettings,
  useUpdateBotSettings, useReconnectBot,
  useBotModules, useStopModule, useStartModule,
  useCookies, useUploadCookies,
  useSysStats, useThreadActivity,
  useSendMessage, useBroadcast,
} from "@/hooks/use-bot";
import { useToast } from "@/hooks/use-toast";

type Tab = "overview" | "logs" | "commands" | "cookies" | "operations" | "config";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",    label: "الرئيسية",  icon: "⚡" },
  { id: "logs",        label: "السجلات",   icon: "📋" },
  { id: "commands",    label: "الأوامر",   icon: "🤖" },
  { id: "cookies",     label: "الكوكيز",   icon: "🍪" },
  { id: "operations",  label: "عمليات",    icon: "🎛️" },
  { id: "config",      label: "الإعدادات", icon: "⚙️" },
];

const COMMAND_CATEGORIES = [
  {
    emoji: "🪭", label: "إدارة البوت",
    cmds: [
      { name: "ادمن",    desc: "إضافة/إزالة مشرفين",               adminOnly: true },
      { name: "admins",  desc: "عرض قائمة المشرفين",               adminOnly: true },
      { name: "قفل",    desc: "قفل/فتح البوت",                    adminOnly: true },
      { name: "lockdown",desc: "وضع الإقفال الكامل",               adminOnly: true },
      { name: "ريفرش",  desc: "إعادة تحميل الإعدادات",             adminOnly: true },
      { name: "cookie",  desc: "تحديث الكوكيز يدوياً",             adminOnly: true },
      { name: "كوكيز",  desc: "تجديد كوكيز الجلسة",               adminOnly: true },
      { name: "رست",    desc: "إعادة تشغيل البوت",                 adminOnly: true },
      { name: "shutdown",desc: "إيقاف البوت بشكل آمن",             adminOnly: true },
    ],
  },
  {
    emoji: "☕", label: "إدارة المجموعة",
    cmds: [
      { name: "nm",      desc: "قفل اسم المجموعة",                 adminOnly: true },
      { name: "كنيات",  desc: "توحيد أسماء الأعضاء",              adminOnly: true },
      { name: "تثبيت",  desc: "تثبيت رسالة",                      adminOnly: true },
      { name: "kick",    desc: "طرد عضو",                          adminOnly: true },
      { name: "ban",     desc: "حظر عضو",                          adminOnly: true },
      { name: "warn",    desc: "إنذار عضو",                        adminOnly: true },
      { name: "gcadmin", desc: "إدارة مشرفي المجموعة",             adminOnly: true },
      { name: "antiout", desc: "منع الخروج من المجموعة",           adminOnly: true },
      { name: "out",     desc: "إخراج البوت من مجموعة",            adminOnly: true },
      { name: "badwords",desc: "فلترة الكلمات المحظورة",           adminOnly: true },
      { name: "تنظيف",  desc: "حذف رسائل المجموعة",               adminOnly: true },
      { name: "تصويت",  desc: "إنشاء تصويت",                      adminOnly: false },
      { name: "صوّت",   desc: "التصويت على خيار",                 adminOnly: false },
      { name: "groupname",desc: "تغيير اسم المجموعة",             adminOnly: true },
    ],
  },
  {
    emoji: "⚖️", label: "نظام",
    cmds: [
      { name: "حماية",  desc: "عرض حالة أنظمة الحماية",           adminOnly: true },
      { name: "صامت",   desc: "وضع الصمت (بدون ردود)",            adminOnly: true },
    ],
  },
  {
    emoji: "🪙", label: "أدوات",
    cmds: [
      { name: "خطاف",       desc: "جدولة رسائل بفترات ثابتة",      adminOnly: true },
      { name: "خطاف2",      desc: "جدولة ذكية بناءً على نشاط",    adminOnly: true },
      { name: "angel",      desc: "إرسال تلقائي متكرر",            adminOnly: true },
      { name: "محرك",       desc: "محرك رسائل",                    adminOnly: true },
      { name: "موتور2",     desc: "محرك رسائل 2",                  adminOnly: true },
      { name: "ترجم",       desc: "ترجمة النصوص",                  adminOnly: false },
      { name: "حاسبة",      desc: "حاسبة رياضية",                  adminOnly: false },
      { name: "عملة",       desc: "تحويل العملات",                 adminOnly: false },
      { name: "طقس_مدينة",  desc: "الطقس حسب المدينة",             adminOnly: false },
      { name: "ذكرني",      desc: "ضبط تذكير",                     adminOnly: false },
      { name: "مؤقت",       desc: "مؤقت عد تنازلي",               adminOnly: false },
      { name: "تكرار",      desc: "تكرار رسالة",                   adminOnly: false },
      { name: "ثنائي",      desc: "تحويل إلى ثنائي",               adminOnly: false },
      { name: "هاش",        desc: "تشفير نص",                      adminOnly: false },
      { name: "صدى",        desc: "صدى الرسالة",                   adminOnly: false },
      { name: "تاريخ",      desc: "معلومات التاريخ",               adminOnly: false },
      { name: "سريع",       desc: "اختبار السرعة",                 adminOnly: false },
      { name: "عد",         desc: "عد الكلمات",                    adminOnly: false },
      { name: "كتلة_جسم",   desc: "حساب BMI",                      adminOnly: false },
      { name: "بحث_عضو",    desc: "بحث عن عضو",                   adminOnly: false },
      { name: "qrgen",      desc: "توليد QR كود",                  adminOnly: false },
      { name: "pp",         desc: "صورة البروفايل",                adminOnly: false },
      { name: "tempmail",   desc: "إيميل مؤقت",                    adminOnly: false },
      { name: "unsend",     desc: "حذف رسالة البوت",               adminOnly: false },
    ],
  },
  {
    emoji: "🕸", label: "ألعاب",
    cmds: [
      { name: "دايفل",    desc: "لعبة الشيطان",           adminOnly: false },
      { name: "كرة8",     desc: "كرة السحر 8",             adminOnly: false },
      { name: "نرد",      desc: "رمي النرد",               adminOnly: false },
      { name: "حظ",       desc: "قياس الحظ",               adminOnly: false },
      { name: "حقيقة",    desc: "حقيقة أم جرأة",           adminOnly: false },
      { name: "خمن",      desc: "لعبة التخمين",            adminOnly: false },
      { name: "صراحة",    desc: "لعبة الصراحة",            adminOnly: false },
      { name: "صواب_خطأ", desc: "صح أم خطأ",               adminOnly: false },
      { name: "اكس",      desc: "لعبة X — O",              adminOnly: false },
      { name: "كلمة",     desc: "لعبة الكلمات",            adminOnly: false },
      { name: "كلمة_سر",  desc: "لعبة كلمة السر",         adminOnly: false },
      { name: "pair",     desc: "مطابقة الأزواج",          adminOnly: false },
      { name: "slot",     desc: "ماكينة الحظ",             adminOnly: false },
    ],
  },
  {
    emoji: "🪶", label: "ترفيه",
    cmds: [
      { name: "تقييم",   desc: "تقييم شيء",               adminOnly: false },
      { name: "عشوائي",  desc: "اختيار عشوائي",           adminOnly: false },
      { name: "قصر",     desc: "قصة قصيرة",               adminOnly: false },
      { name: "شخصية",   desc: "اختبار الشخصية",          adminOnly: false },
    ],
  },
  {
    emoji: "🧲", label: "ذكاء اصطناعي",
    cmds: [
      { name: "اصنع",    desc: "توليد صورة بالذكاء الاصطناعي", adminOnly: false },
    ],
  },
  {
    emoji: "☢️", label: "ميديا",
    cmds: [
      { name: "صورة",    desc: "بحث عن صورة",              adminOnly: false },
      { name: "تيكتوك",  desc: "تحميل فيديو TikTok",       adminOnly: false },
      { name: "بنترست",  desc: "بحث Pinterest",            adminOnly: false },
      { name: "بطاقة",   desc: "بطاقة تهنئة",             adminOnly: false },
      { name: "جلب",     desc: "جلب ميديا",                adminOnly: false },
      { name: "imgen",   desc: "توليد صورة",               adminOnly: false },
      { name: "song",    desc: "بحث أغاني",                adminOnly: false },
    ],
  },
  {
    emoji: "🪅", label: "معلومات",
    cmds: [
      { name: "بينغ",     desc: "قياس استجابة البوت",     adminOnly: false },
      { name: "ابتيم",    desc: "وقت التشغيل والنظام",    adminOnly: false },
      { name: "اوامر",    desc: "قائمة الأوامر",          adminOnly: false },
      { name: "احصائيات", desc: "إحصائيات البوت",         adminOnly: false },
      { name: "اعلام",    desc: "إعلانات",                adminOnly: false },
      { name: "بروفايل",  desc: "معلومات البروفايل",      adminOnly: false },
      { name: "حسابات",   desc: "قائمة الحسابات",         adminOnly: false },
      { name: "معرف",     desc: "معرّف المستخدم/المجموعة",adminOnly: false },
      { name: "معلومات",  desc: "معلومات عامة",           adminOnly: false },
      { name: "أصدقاء",   desc: "قائمة الأصدقاء",         adminOnly: false },
    ],
  },
  {
    emoji: "🧬", label: "مطور",
    cmds: [
      { name: "تست",       desc: "اختبار تطويري",            adminOnly: true },
      { name: "نيكسس",    desc: "ذكاء اصطناعي Nexus",       adminOnly: false },
      { name: "نيكسسفان", desc: "شخصية مارين — Nexus Fan",  adminOnly: false },
    ],
  },
];

function fmtMs(ms: number | null) {
  if (!ms) return "—";
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(1)}h`;
  if (ms >= 60000)   return `${(ms / 60000).toFixed(0)}m`;
  return `${(ms / 1000).toFixed(0)}s`;
}

function fmtCountdown(fireAt: number | null) {
  if (!fireAt) return "—";
  const diff = Math.max(0, Math.floor((fireAt - Date.now()) / 60000));
  return `${diff}m`;
}

function logClass(level: string) {
  if (level === "ERROR") return "nex-log-err";
  if (level === "WARN")  return "nex-log-warn";
  if (level === "INFO")  return "nex-log-info";
  return "nex-log-dim";
}

function Sparkline({ data, color = "#3d9eff", height = 30 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return <div style={{ width: 100, height }} />;
  const max = Math.max(...data, 1);
  const w = 100;
  const h = height;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: status } = useBotStatus();
  const { data: logsData } = useBotLogs();
  const { data: sysStats } = useSysStats();
  const reconnect = useReconnectBot();
  const { toast } = useToast();
  const logsRef = useRef<HTMLDivElement>(null);

  const logs = (logsData?.logs || []) as { time: number; level: string; message: string }[];
  const recentLogs = logs.slice(-8);

  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);
  useEffect(() => {
    if (sysStats) {
      setCpuHistory((h) => [...h.slice(-19), sysStats.cpu]);
      setRamHistory((h) => [...h.slice(-19), sysStats.ramMB]);
    }
  }, [sysStats]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const prot = status?.protections || {};
  const uptime = status?.startedAt
    ? Math.floor((Date.now() - new Date(status.startedAt).getTime()) / 60000)
    : 0;
  const online = !!status?.running;

  const protectionRows = [
    { label: "تجديد الكوكيز",  key: "cookieRenewal",  color: "#30d988", icon: "🍪" },
    { label: "زيارة الموقع",   key: "siteVisit",      color: "#9b72f7", icon: "🌐" },
    { label: "النبض",           key: "ping",           color: "#3d9eff", icon: "📡" },
    { label: "GraphQL",         key: "graphqlVisit",   color: "#f5c842", icon: "🔗" },
  ];

  const newProtRows = [
    { label: "محرك التخفي",    active: true,  color: "#5aadff", icon: "🕵️" },
    { label: "مراقبة MQTT",    active: true,  color: "#30d988", icon: "📶" },
    { label: "حارس القرص",     active: true,  color: "#f5c842", icon: "💾" },
    { label: "حلقة الأحداث",   active: true,  color: "#9b72f7", icon: "🔄" },
  ];

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Status header */}
      <div className="nex-card nex-card-accent" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={`nex-dot ${online ? "nex-dot-online" : "nex-dot-offline"}`} />
            <span style={{ fontSize: ".78rem", fontWeight: 700, color: online ? "var(--nex-green)" : "var(--nex-red)", letterSpacing: ".4px" }}>
              {online ? "متصل — ONLINE" : "غير متصل — OFFLINE"}
            </span>
          </div>
          <button
            className="nex-btn nex-btn-ghost"
            style={{ padding: "5px 12px", fontSize: ".72rem" }}
            onClick={() => reconnect.mutate(undefined, {
              onSuccess: () => toast({ title: "✅ تم", description: "تم إرسال إشارة إعادة الاتصال." }),
            })}
            disabled={reconnect.isPending}
          >
            {reconnect.isPending ? "جاري…" : "↺ إعادة الاتصال"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "معرف الحساب", value: status?.accountId || "—" },
            { label: "المنطقة",     value: status?.region || "—" },
            { label: "وقت التشغيل", value: `${uptime} دقيقة` },
            { label: "الكوكيز القادمة", value: fmtCountdown(prot?.cookieRenewal?.nextFireAt ?? null) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="nex-lbl">{label}</div>
              <div style={{ fontSize: ".88rem", fontWeight: 700, fontFamily: "var(--app-font-mono)", color: "#e8eaf6" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Protection timers */}
      <div>
        <div className="nex-lbl">🛡️ جداول الحماية الأربع</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {protectionRows.map(({ label, key, color, icon }) => (
            <div key={key} className="nex-prot-row">
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span>{icon}</span>
                <span style={{ fontSize: ".78rem", color: "#8892b0", fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: ".88rem", fontWeight: 700, fontFamily: "var(--app-font-mono)", color }}>{fmtCountdown((prot as Record<string, { nextFireAt?: number }>)[key]?.nextFireAt ?? null)}</span>
                <span style={{ fontSize: ".6rem", color: "#3f4a68" }}>التالي</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New protections (P15–P18) */}
      <div>
        <div className="nex-lbl">🔒 الحمايات المتقدمة (P15–P18)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {newProtRows.map(({ label, active, color, icon }) => (
            <div key={label} className="nex-prot-row">
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span>{icon}</span>
                <span style={{ fontSize: ".78rem", color: "#8892b0", fontWeight: 600 }}>{label}</span>
              </div>
              <span className={`nex-badge ${active ? "nex-badge-ok" : "nex-badge-off"}`}>{active ? "نشط" : "متوقف"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sys stats */}
      <div>
        <div className="nex-lbl">💻 موارد النظام</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="nex-stat-box" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: ".7rem", color: "#8892b0", fontWeight: 700 }}>CPU</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#3d9eff", fontFamily: "var(--app-font-mono)" }}>{sysStats?.cpu ?? "—"}%</span>
            </div>
            <Sparkline data={cpuHistory} color="#3d9eff" />
          </div>
          <div className="nex-stat-box" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: ".7rem", color: "#8892b0", fontWeight: 700 }}>RAM</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#9b72f7", fontFamily: "var(--app-font-mono)" }}>
                {sysStats ? `${sysStats.ramMB} MB` : "—"}
              </span>
            </div>
            <Sparkline data={ramHistory} color="#9b72f7" />
            {sysStats && (
              <div style={{ fontSize: ".62rem", color: "#3f4a68" }}>{sysStats.ramMB} / {sysStats.totalRamMB} MB</div>
            )}
          </div>
        </div>
      </div>

      {/* Mini terminal */}
      <div>
        <div className="nex-lbl">🖥️ آخر السجلات</div>
        <div className="nex-terminal" ref={logsRef} style={{ height: 180 }}>
          {recentLogs.length === 0 ? (
            <span className="nex-log-dim">لا توجد سجلات بعد…</span>
          ) : (
            recentLogs.map((log, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "#3f4a68", flexShrink: 0 }}>{new Date(log.time).toLocaleTimeString("ar-SA")}</span>
                <span className={logClass(log.level)} style={{ flexShrink: 0, minWidth: 36 }}>{log.level}</span>
                <span style={{ color: "rgba(232,234,246,.7)", wordBreak: "break-all" }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logs Tab
// ─────────────────────────────────────────────────────────────────────────────
function LogsTab() {
  const { data: logsData } = useBotLogs();
  const [filter, setFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");
  const logsRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const allLogs = (logsData?.logs || []) as { time: number; level: string; message: string }[];
  const logs = filter === "ALL" ? allLogs : allLogs.filter((l) => l.level === filter);

  useEffect(() => {
    if (autoScroll && logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs, autoScroll]);

  const counts = {
    INFO:  allLogs.filter((l) => l.level === "INFO").length,
    WARN:  allLogs.filter((l) => l.level === "WARN").length,
    ERROR: allLogs.filter((l) => l.level === "ERROR").length,
  };

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="nex-card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["ALL", "INFO", "WARN", "ERROR"] as const).map((f) => (
              <button
                key={f}
                className={`nex-tab ${filter === f ? "active" : ""}`}
                style={{ padding: "4px 12px", fontSize: ".72rem" }}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? `الكل (${allLogs.length})` : f === "INFO" ? `معلومات (${counts.INFO})` : f === "WARN" ? `تحذير (${counts.WARN})` : `أخطاء (${counts.ERROR})`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".72rem", color: "#8892b0", cursor: "pointer" }}>
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} style={{ accentColor: "#3d9eff" }} />
              تمرير تلقائي
            </label>
            <span style={{ fontSize: ".68rem", color: "#3f4a68" }}>تحديث كل 4s</span>
          </div>
        </div>
      </div>

      <div className="nex-terminal" ref={logsRef} style={{ height: "calc(100vh - 260px)", minHeight: 320 }}>
        {logs.length === 0 ? (
          <span className="nex-log-dim">لا توجد سجلات تطابق الفلتر…</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 1 }}>
              <span style={{ color: "#3f4a68", flexShrink: 0 }}>{new Date(log.time).toLocaleTimeString("ar-SA")}</span>
              <span className={logClass(log.level)} style={{ flexShrink: 0, minWidth: 40 }}>{log.level}</span>
              <span style={{ color: "rgba(232,234,246,.75)", wordBreak: "break-all" }}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands Tab — Nexus category style
// ─────────────────────────────────────────────────────────────────────────────
function CommandsTab() {
  const { data: settings } = useBotSettings();
  const prefix = settings?.prefix || "/";
  const totalCmds = COMMAND_CATEGORIES.reduce((acc, c) => acc + c.cmds.length, 0);

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="nex-card nex-card-accent" style={{ padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff", letterSpacing: ".3px" }}>🤖 قائمة أوامر Nexus</div>
            <div style={{ fontSize: ".68rem", color: "#3f4a68", marginTop: 3 }}>تحديث تلقائي — دائماً محدّث</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="nex-badge nex-badge-blue">البادئة: {prefix}</span>
            <span className="nex-badge nex-badge-purple">{totalCmds} أمر</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {COMMAND_CATEGORIES.map((cat) => (
          <div key={cat.label} className="nex-card" style={{ padding: "14px 16px" }}>
            <div className="nex-cmd-cat">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span style={{ marginRight: "auto", color: "#3f4a68" }}>({cat.cmds.length})</span>
            </div>
            {cat.cmds.map((cmd) => (
              <div key={cmd.name} className="nex-cmd-item">
                <div style={{ flexShrink: 0, minWidth: 36 }}>
                  {cmd.adminOnly
                    ? <span className="nex-badge nex-badge-warn" style={{ fontSize: ".58rem", padding: "1px 5px" }}>🔒</span>
                    : <span className="nex-badge nex-badge-ok" style={{ fontSize: ".58rem", padding: "1px 5px" }}>👥</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#a8d4ff", fontFamily: "var(--app-font-mono)" }}>
                    {prefix}{cmd.name}
                  </div>
                  <div style={{ fontSize: ".72rem", color: "#8892b0", marginTop: 2 }}>{cmd.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group Picker — shared across operations sub-tabs
// ─────────────────────────────────────────────────────────────────────────────
function GroupPicker({ onSelect }: { onSelect: (tid: string) => void }) {
  const { data } = useThreadActivity();
  const [open, setOpen] = useState(false);
  const threads = Object.keys(data?.heatmap || {});

  if (!threads.length) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="nex-btn nex-btn-ghost"
        style={{ fontSize: ".7rem", padding: "3px 10px" }}
        onClick={() => setOpen(o => !o)}
      >
        🏘 اختر مجموعة
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "100%", right: 0, zIndex: 100, marginTop: 4,
            background: "#0d1025", border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 8, minWidth: 240, maxHeight: 200, overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,.6)", padding: 4,
          }}>
            {threads.map(tid => (
              <button
                key={tid}
                onClick={() => { onSelect(tid); setOpen(false); }}
                style={{
                  width: "100%", textAlign: "right", padding: "7px 10px",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: ".72rem", fontFamily: "monospace", color: "#8892b0",
                  borderRadius: 6, display: "block", transition: "background .15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,158,255,.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {tid}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookies Tab
// ─────────────────────────────────────────────────────────────────────────────
function CookiesTab() {
  const { data: cookies } = useCookies();
  const uploadCookies = useUploadCookies();
  const { toast } = useToast();
  const [raw, setRaw] = useState("");

  const handleUpload = () => {
    let parsed: unknown;
    try { parsed = JSON.parse(raw.trim()); } catch {
      toast({ title: "❌ خطأ", description: "الصيغة غير صحيحة — يجب أن تكون JSON.", variant: "destructive" });
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast({ title: "❌ خطأ", description: "appstate يجب أن يكون مصفوفة غير فارغة.", variant: "destructive" });
      return;
    }
    uploadCookies.mutate(parsed as unknown[], {
      onSuccess: () => { toast({ title: "✅ تم", description: "تم رفع الكوكيز. سيعيد البوت الاتصال." }); setRaw(""); },
      onError: () => toast({ title: "❌ فشل", description: "خطأ أثناء رفع الكوكيز.", variant: "destructive" }),
    });
  };

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div className="nex-lbl">📊 حالة الكوكيز الحالية</div>
        {cookies ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="nex-badge nex-badge-ok">✅ صالحة</span>
            <span style={{ fontSize: ".78rem", color: "#8892b0" }}>{cookies.count} كوكي محفوظ</span>
          </div>
        ) : (
          <span className="nex-badge nex-badge-warn">⚠️ لا توجد بيانات</span>
        )}
      </div>

      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div className="nex-lbl">⬆️ رفع كوكيز جديدة</div>
        <div style={{ marginBottom: 10, fontSize: ".72rem", color: "#8892b0" }}>
          الصق محتوى appstate.json (مصفوفة JSON) ثم اضغط رفع.
        </div>
        <textarea
          className="nex-textarea"
          rows={8}
          placeholder='[{"key":"c_user","value":"...","domain":".facebook.com",...},...]'
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div style={{ marginTop: 10 }}>
          <button
            className="nex-btn nex-btn-primary"
            onClick={handleUpload}
            disabled={uploadCookies.isPending || !raw.trim()}
          >
            {uploadCookies.isPending ? "جاري الرفع…" : "⬆️ رفع وإعادة الاتصال"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduler Tab — خطاف and خطاف2
// ─────────────────────────────────────────────────────────────────────────────
// ─── Activity Heatmap Component ───────────────────────────────────────────────
function ActivityHeatmap() {
  const { data, isLoading } = useThreadActivity();
  const [selectedThread, setSelectedThread] = useState<string>("");

  const heatmap: Record<string, number[]> = data?.heatmap || {};
  const threads = Object.keys(heatmap);

  // Auto-select first thread
  const thread = selectedThread && heatmap[selectedThread] ? selectedThread : (threads[0] || "");
  const hours: number[] = thread ? heatmap[thread] : new Array(24).fill(0);
  const maxVal = Math.max(...hours, 1);

  const HOUR_LABELS = ["12م","1","2","3","4","5","6","7","8","9","10","11","12ظ","1","2","3","4","5","6","7","8","9","10","11"];

  function getColor(val: number): string {
    if (val === 0) return "rgba(255,255,255,.04)";
    const pct = val / maxVal;
    if (pct < 0.25) return "rgba(56,189,248,.2)";
    if (pct < 0.5)  return "rgba(56,189,248,.45)";
    if (pct < 0.75) return "rgba(56,189,248,.7)";
    return "rgba(56,189,248,1)";
  }

  const totalMsgs = hours.reduce((a, b) => a + b, 0);
  const peakHour = hours.indexOf(Math.max(...hours));

  return (
    <div className="nex-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#38bdf8" }}>📊 خريطة نشاط المجموعات</div>
          <div style={{ fontSize: ".68rem", color: "#3f4a68", marginTop: 2 }}>توزيع الرسائل حسب ساعة اليوم (24 ساعة)</div>
        </div>
        {isLoading && <span style={{ fontSize: ".65rem", color: "#3f4a68" }}>جارٍ التحميل...</span>}
        {data?.updatedAt && (
          <span style={{ fontSize: ".62rem", color: "#3f4a68" }}>
            آخر تحديث: {new Date(data.updatedAt).toLocaleTimeString("ar-SA")}
          </span>
        )}
      </div>

      {!threads.length ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "#3f4a68", fontSize: ".78rem" }}>
          🔇 لا توجد بيانات نشاط بعد — ستظهر بعد تلقّي الرسائل
        </div>
      ) : (
        <>
          {threads.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div className="nex-lbl">اختر المجموعة</div>
              <select
                className="nex-input"
                value={thread}
                onChange={e => setSelectedThread(e.target.value)}
                style={{ fontSize: ".75rem" }}
              >
                {threads.map(tid => (
                  <option key={tid} value={tid}>{tid}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(24, 1fr)", gap: 3, marginBottom: 8 }}>
            {hours.map((val, h) => (
              <div key={h} title={`${HOUR_LABELS[h]}: ${val} رسالة`}
                style={{
                  height: 28,
                  borderRadius: 4,
                  background: getColor(val),
                  border: "1px solid rgba(255,255,255,.04)",
                  cursor: "default",
                  transition: "background .2s",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            {[0, 6, 12, 18, 23].map(h => (
              <span key={h} style={{ fontSize: ".58rem", color: "#3f4a68" }}>{HOUR_LABELS[h]}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: ".72rem", color: "#8892b0" }}>
              📨 الإجمالي اليوم: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{totalMsgs}</span>
            </div>
            <div style={{ fontSize: ".72rem", color: "#8892b0" }}>
              ⏰ ذروة النشاط: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{HOUR_LABELS[peakHour]} ({hours[peakHour]})</span>
            </div>
            <div style={{ fontSize: ".72rem", color: "#8892b0" }}>
              🏘 المجموعات: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{threads.length}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: ".62rem", color: "#3f4a68" }}>أقل</span>
            {["rgba(255,255,255,.04)","rgba(56,189,248,.2)","rgba(56,189,248,.45)","rgba(56,189,248,.7)","rgba(56,189,248,1)"].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: "1px solid rgba(255,255,255,.06)" }} />
            ))}
            <span style={{ fontSize: ".62rem", color: "#3f4a68" }}>أكثر</span>
          </div>
        </>
      )}
    </div>
  );
}

function SchedulerTab() {
  const { data: modules } = useBotModules();
  const startModule = useStartModule();
  const stopModule  = useStopModule();
  const { toast } = useToast();

  // خطاف form
  const [h1tid, setH1tid] = useState("");
  const [h1msg, setH1msg] = useState("");
  const [h1sec, setH1sec] = useState("60");

  // خطاف2 form
  const [h2tid, setH2tid] = useState("");
  const [h2msg, setH2msg] = useState("");
  const [h2min, setH2min] = useState("60");
  const [h2max, setH2max] = useState("180");
  const [h2win, setH2win] = useState("45");

  const ok  = (msg: string): void => { toast({ title: "✅ تم", description: msg }); };
  const err = (msg: string): void => { toast({ title: "❌ خطأ", description: msg, variant: "destructive" }); };

  const startHook1 = () => {
    if (!h1tid.trim()) return err("أدخل معرف المجموعة.");
    if (!h1msg.trim()) return err("أدخل نص الرسالة.");
    const sec = Math.max(5, parseInt(h1sec) || 60);
    startModule.mutate(
      { type: "hook_start", threadID: h1tid.trim(), message: h1msg.trim(), intervalMs: sec * 1000 },
      { onSuccess: () => ok("تم تفعيل الخطاف. سيبدأ خلال 5 ثوانٍ."), onError: () => err("فشل إرسال الأمر.") }
    );
  };

  const startHook2 = () => {
    if (!h2tid.trim()) return err("أدخل معرف المجموعة.");
    if (!h2msg.trim()) return err("أدخل نص الرسالة.");
    const minMs = Math.max(10, parseInt(h2min) || 60) * 1000;
    const maxMs = Math.max(minMs + 10000, parseInt(h2max) || 180) * 1000;
    const winMs = Math.max(5, parseInt(h2win) || 45) * 60 * 1000;
    startModule.mutate(
      { type: "hook2_start", threadID: h2tid.trim(), message: h2msg.trim(), minIntervalMs: minMs, maxIntervalMs: maxMs, activeWindowMs: winMs },
      { onSuccess: () => ok("تم تفعيل الخطاف 2 الذكي."), onError: () => err("فشل إرسال الأمر.") }
    );
  };

  const activeHooks1 = modules ? Object.entries(modules.schedulers).filter(([, s]) => s.active) : [];
  const activeHooks2 = modules ? Object.entries(modules.schedulers2 || {}).filter(([, s]) => s.active) : [];

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* خطاف section */}
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff" }}>⏰ الخطاف — جدولة ثابتة</div>
          <span className={`nex-badge ${activeHooks1.length > 0 ? "nex-badge-ok" : "nex-badge-off"}`}>
            {activeHooks1.length > 0 ? `${activeHooks1.length} نشط` : "متوقف"}
          </span>
        </div>

        {activeHooks1.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="nex-lbl">الخطافات النشطة</div>
            {activeHooks1.map(([tid, s]) => (
              <div key={tid} className="nex-prot-row" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: ".72rem", fontFamily: "var(--app-font-mono)", color: "#8892b0" }}>{tid}</div>
                  <div style={{ fontSize: ".78rem", color: "#e8eaf6", marginTop: 2 }}>"{s.message}"</div>
                  <div style={{ fontSize: ".65rem", color: "#3f4a68" }}>كل {fmtMs(s.intervalMs)}</div>
                </div>
                <button className="nex-btn nex-btn-danger" style={{ padding: "4px 10px", fontSize: ".7rem" }}
                  onClick={() => stopModule.mutate({ type: "hook_stop", threadID: tid }, { onSuccess: () => ok("تم إيقاف الخطاف.") })}>
                  إيقاف
                </button>
              </div>
            ))}
            <button className="nex-btn nex-btn-danger" style={{ width: "100%", marginTop: 4 }}
              onClick={() => stopModule.mutate({ type: "hook_stop" }, { onSuccess: () => ok("تم إيقاف جميع الخطافات.") })}>
              ⏹ إيقاف الكل
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="nex-lbl" style={{ margin: 0 }}>معرف المجموعة</div>
              <GroupPicker onSelect={setH1tid} />
            </div>
            <input className="nex-input" placeholder="100012345678" value={h1tid} onChange={(e) => setH1tid(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">نص الرسالة</div>
            <input className="nex-input" placeholder="أدخل الرسالة التي ستُرسل تلقائياً" value={h1msg} onChange={(e) => setH1msg(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">الفترة (بالثواني)</div>
            <input className="nex-input" type="number" min={5} placeholder="60" value={h1sec} onChange={(e) => setH1sec(e.target.value)} style={{ width: 120 }} />
          </div>
          <button className="nex-btn nex-btn-primary" onClick={startHook1} disabled={startModule.isPending}>
            {startModule.isPending ? "جاري…" : "▶ تفعيل الخطاف"}
          </button>
        </div>
      </div>

      {/* خطاف2 section */}
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#b89efb" }}>⚡ الخطاف 2 — ذكي ونشط</div>
            <div style={{ fontSize: ".68rem", color: "#3f4a68", marginTop: 2 }}>يرسل فقط عند وجود نشاط حديث في المجموعة</div>
          </div>
          <span className={`nex-badge ${activeHooks2.length > 0 ? "nex-badge-purple" : "nex-badge-off"}`}>
            {activeHooks2.length > 0 ? `${activeHooks2.length} نشط` : "متوقف"}
          </span>
        </div>

        {activeHooks2.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="nex-lbl">الخطافات 2 النشطة</div>
            {activeHooks2.map(([tid, s]) => (
              <div key={tid} className="nex-prot-row" style={{ marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: ".72rem", fontFamily: "var(--app-font-mono)", color: "#8892b0" }}>{tid}</div>
                  <div style={{ fontSize: ".78rem", color: "#e8eaf6", marginTop: 2 }}>"{s.message}"</div>
                  <div style={{ fontSize: ".65rem", color: "#3f4a68" }}>{fmtMs(s.minMs)} — {fmtMs(s.maxMs)} | نافذة: {fmtMs(s.activeWindowMs)}</div>
                </div>
                <button className="nex-btn nex-btn-danger" style={{ padding: "4px 10px", fontSize: ".7rem" }}
                  onClick={() => stopModule.mutate({ type: "hook2_stop", threadID: tid }, { onSuccess: () => ok("تم إيقاف الخطاف 2.") })}>
                  إيقاف
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="nex-lbl" style={{ margin: 0 }}>معرف المجموعة</div>
              <GroupPicker onSelect={setH2tid} />
            </div>
            <input className="nex-input" placeholder="100012345678" value={h2tid} onChange={(e) => setH2tid(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">نص الرسالة</div>
            <input className="nex-input" placeholder="أدخل الرسالة" value={h2msg} onChange={(e) => setH2msg(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <div className="nex-lbl">الحد الأدنى (ث)</div>
              <input className="nex-input" type="number" min={10} value={h2min} onChange={(e) => setH2min(e.target.value)} />
            </div>
            <div>
              <div className="nex-lbl">الحد الأقصى (ث)</div>
              <input className="nex-input" type="number" min={11} value={h2max} onChange={(e) => setH2max(e.target.value)} />
            </div>
            <div>
              <div className="nex-lbl">نافذة النشاط (د)</div>
              <input className="nex-input" type="number" min={5} value={h2win} onChange={(e) => setH2win(e.target.value)} />
            </div>
          </div>
          <button className="nex-btn nex-btn-primary" style={{ background: "rgba(155,114,247,.18)", color: "#b89efb", borderColor: "rgba(155,114,247,.3)" }}
            onClick={startHook2} disabled={startModule.isPending}>
            {startModule.isPending ? "جاري…" : "⚡ تفعيل الخطاف 2"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Control Tab — NM, nicknames, bot lock
// ─────────────────────────────────────────────────────────────────────────────
function ControlTab() {
  const { data: status } = useBotStatus();
  const { data: modules } = useBotModules();
  const startModule = useStartModule();
  const stopModule  = useStopModule();
  const { toast } = useToast();

  const [nmTid, setNmTid]   = useState("");
  const [nmName, setNmName] = useState("");
  const [nkTid, setNkTid]   = useState("");
  const [nkNick, setNkNick] = useState("");
  const [nkSec, setNkSec]   = useState("30");

  const ok  = (msg: string): void => { toast({ title: "✅ تم", description: msg }); };
  const err = (msg: string): void => { toast({ title: "❌ خطأ", description: msg, variant: "destructive" }); };

  const locked = status?.botState?.locked ?? false;

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Bot lock */}
      <div className="nex-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: ".88rem", fontWeight: 800, color: locked ? "#f0536a" : "#30d988" }}>
              {locked ? "🔒 البوت مقفول" : "🔓 البوت مفتوح"}
            </div>
            <div style={{ fontSize: ".7rem", color: "#8892b0", marginTop: 2 }}>
              {locked ? "لا يستجيب للمستخدمين العاديين" : "يستجيب لجميع المستخدمين"}
            </div>
          </div>
          <span className={`nex-badge ${locked ? "nex-badge-err" : "nex-badge-ok"}`}>
            {locked ? "مقفول" : "نشط"}
          </span>
        </div>
      </div>

      {/* NM */}
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff" }}>🔒 قفل الاسم (nm)</div>
          <span className={`nex-badge ${modules?.nameLock.active ? "nex-badge-ok" : "nex-badge-off"}`}>
            {modules?.nameLock.active ? `نشط — ${modules.nameLock.name || "—"}` : "متوقف"}
          </span>
        </div>

        {modules?.nameLock.active && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: ".72rem", fontFamily: "var(--app-font-mono)", color: "#8892b0", marginBottom: 4 }}>
              Thread: {modules.nameLock.threadId}
            </div>
            <button className="nex-btn nex-btn-danger" style={{ width: "100%" }}
              onClick={() => stopModule.mutate({ type: "nm_stop" }, { onSuccess: () => ok("تم إيقاف قفل الاسم.") })}>
              ⏹ إيقاف قفل الاسم
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="nex-lbl" style={{ margin: 0 }}>معرف المجموعة</div>
              <GroupPicker onSelect={setNmTid} />
            </div>
            <input className="nex-input" placeholder="100012345678" value={nmTid} onChange={(e) => setNmTid(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">اسم المجموعة</div>
            <input className="nex-input" placeholder="اسم المجموعة المراد قفله" value={nmName} onChange={(e) => setNmName(e.target.value)} />
          </div>
          <button className="nex-btn nex-btn-primary" disabled={startModule.isPending}
            onClick={() => {
              if (!nmTid.trim()) return err("أدخل معرف المجموعة.");
              if (!nmName.trim()) return err("أدخل اسم المجموعة.");
              startModule.mutate({ type: "nm_start", threadID: nmTid.trim(), name: nmName.trim() },
                { onSuccess: () => ok("تم تفعيل قفل الاسم."), onError: () => err("فشل الأمر.") });
            }}>
            ▶ تفعيل قفل الاسم
          </button>
        </div>
      </div>

      {/* Nicknames */}
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff" }}>🏷️ حماية الكنيات (كنيات)</div>
          <span className={`nex-badge ${Object.values(modules?.nicknames || {}).some((n) => n.active) ? "nex-badge-ok" : "nex-badge-off"}`}>
            {Object.values(modules?.nicknames || {}).filter((n) => n.active).length > 0
              ? `${Object.values(modules?.nicknames || {}).filter((n) => n.active).length} نشط`
              : "متوقف"}
          </span>
        </div>

        {Object.entries(modules?.nicknames || {}).filter(([, n]) => n.active).map(([tid, n]) => (
          <div key={tid} className="nex-prot-row" style={{ marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: ".72rem", fontFamily: "var(--app-font-mono)", color: "#8892b0" }}>{tid}</div>
              <div style={{ fontSize: ".78rem", color: "#e8eaf6" }}>🏷️ {n.nickname} · {n.participantCount} أعضاء</div>
              <div style={{ fontSize: ".65rem", color: "#3f4a68" }}>كل {fmtMs(n.intervalMs)}</div>
            </div>
            <button className="nex-btn nex-btn-danger" style={{ padding: "4px 10px", fontSize: ".7rem" }}
              onClick={() => stopModule.mutate({ type: "nicknames_stop", threadID: tid }, { onSuccess: () => ok("تم الإيقاف.") })}>
              إيقاف
            </button>
          </div>
        ))}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="nex-lbl" style={{ margin: 0 }}>معرف المجموعة</div>
              <GroupPicker onSelect={setNkTid} />
            </div>
            <input className="nex-input" placeholder="100012345678" value={nkTid} onChange={(e) => setNkTid(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">الكنية الموحدة</div>
            <input className="nex-input" placeholder="مثال: ⭐ عضو" value={nkNick} onChange={(e) => setNkNick(e.target.value)} />
          </div>
          <div>
            <div className="nex-lbl">الفترة (ثانية)</div>
            <input className="nex-input" type="number" min={5} value={nkSec} onChange={(e) => setNkSec(e.target.value)} style={{ width: 100 }} />
          </div>
          <button className="nex-btn nex-btn-primary" disabled={startModule.isPending}
            onClick={() => {
              if (!nkTid.trim()) return err("أدخل معرف المجموعة.");
              if (!nkNick.trim()) return err("أدخل الكنية.");
              const ms = Math.max(5, parseInt(nkSec) || 30) * 1000;
              startModule.mutate({ type: "nicknames_start", threadID: nkTid.trim(), nickname: nkNick.trim(), intervalMs: ms },
                { onSuccess: () => ok("تم تفعيل حماية الكنيات."), onError: () => err("فشل الأمر.") });
            }}>
            ▶ تفعيل الكنيات
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Tab
// ─────────────────────────────────────────────────────────────────────────────
function ConfigTab() {
  const { data: settings } = useBotSettings();
  const updateSettings = useUpdateBotSettings();
  const { toast } = useToast();

  const [prefix,  setPrefix]  = useState("");
  const [botName, setBotName] = useState("");
  const [admins,  setAdmins]  = useState("");

  useEffect(() => {
    if (settings) {
      setPrefix(settings.prefix || "/");
      setBotName(settings.botName || "Nexus");
      setAdmins((settings.admins || []).join(", "));
    }
  }, [settings]);

  const saveSettings = () => {
    const adminList = admins.split(",").map((s: string) => s.trim()).filter(Boolean);
    updateSettings.mutate({ prefix: prefix.trim() || "/", botName: botName.trim() || "Nexus", admins: adminList }, {
      onSuccess: () => toast({ title: "✅ تم", description: "تم حفظ الإعدادات." }),
      onError:   () => toast({ title: "❌ خطأ", description: "فشل الحفظ.", variant: "destructive" }),
    });
  };

  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff", marginBottom: 14 }}>⚙️ إعدادات البوت</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div className="nex-lbl">البادئة (Prefix)</div>
              <input className="nex-input" value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={5} />
            </div>
            <div>
              <div className="nex-lbl">اسم البوت</div>
              <input className="nex-input" value={botName} onChange={(e) => setBotName(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="nex-lbl">معرفات المشرفين (مفصولة بفاصلة)</div>
            <input className="nex-input" placeholder="100012345678, 100087654321" value={admins} onChange={(e) => setAdmins(e.target.value)} />
          </div>
          <button className="nex-btn nex-btn-primary" onClick={saveSettings} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "جاري الحفظ…" : "💾 حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Send message tab
// ─────────────────────────────────────────────────────────────────────────────
function SendTab() {
  const [threadID, setThreadID] = useState("");
  const [message,  setMessage]  = useState("");
  const [lastSent, setLastSent] = useState<{ threadID: string; message: string } | null>(null);
  const sendMsg  = useSendMessage();
  const { toast } = useToast();

  function send() {
    const tid = threadID.trim();
    const msg = message.trim();
    if (!tid || !msg) return;
    sendMsg.mutate({ threadID: tid, message: msg }, {
      onSuccess: () => {
        toast({ title: "✅ تم الإرسال", description: `رسالة موجّهة إلى ${tid}` });
        setLastSent({ threadID: tid, message: msg });
        setMessage("");
      },
      onError: (e: Error) => {
        toast({ title: "❌ فشل الإرسال", description: e.message, variant: "destructive" });
      },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff", marginBottom: 14 }}>
          📨 إرسال رسالة عبر البوت
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="nex-lbl" style={{ margin: 0 }}>معرّف المجموعة أو المحادثة (Thread ID)</div>
              <GroupPicker onSelect={setThreadID} />
            </div>
            <input
              className="nex-input"
              placeholder="100012345678901"
              value={threadID}
              onChange={(e) => setThreadID(e.target.value)}
              style={{ direction: "ltr" }}
            />
          </div>
          <div>
            <div className="nex-lbl">الرسالة</div>
            <textarea
              className="nex-textarea"
              rows={5}
              placeholder="اكتب رسالتك هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ direction: "rtl", resize: "vertical" }}
            />
          </div>
          <button
            className="nex-btn nex-btn-primary"
            onClick={send}
            disabled={sendMsg.isPending || !threadID.trim() || !message.trim()}
            style={{ alignSelf: "flex-start" }}
          >
            {sendMsg.isPending ? "⏳ جاري الإرسال…" : "📨 إرسال"}
          </button>
        </div>
      </div>

      {lastSent && (
        <div className="nex-card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#30d988", marginBottom: 8 }}>
            ✅ آخر رسالة مُرسَلة
          </div>
          <div style={{ fontSize: ".72rem", color: "#8892b0", marginBottom: 4 }}>
            إلى: <span style={{ color: "#5aadff", fontFamily: "monospace" }}>{lastSent.threadID}</span>
          </div>
          <div style={{
            background: "rgba(0,0,0,.3)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: ".8rem",
            color: "#e8eaf6",
            direction: "rtl",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {lastSent.message}
          </div>
        </div>
      )}

      <div className="nex-card" style={{ padding: "14px 18px" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#8892b0", marginBottom: 8 }}>
          💡 كيف تعمل هذه الميزة؟
        </div>
        <div style={{ fontSize: ".72rem", color: "#3f4a68", lineHeight: 1.7 }}>
          يتم تمرير الرسالة عبر نظام الأوامر الداخلي للبوت.
          سيتم إرسالها من حساب البوت إلى المجموعة المحددة خلال ثوانٍ.
          احرص على أن يكون البوت عضواً في المجموعة أو أن تكون محادثة مباشرة معه.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Broadcast Tab
// ─────────────────────────────────────────────────────────────────────────────
function BroadcastTab() {
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState<{ queued: number; threadIDs: string[] } | null>(null);
  const broadcast = useBroadcast();
  const { data: activityData } = useThreadActivity();
  const { toast } = useToast();

  const activeCount = Object.keys(activityData?.heatmap || {}).length;

  function send() {
    const msg = message.trim();
    if (!msg) return;
    broadcast.mutate({ message: msg }, {
      onSuccess: (data) => {
        toast({ title: "✅ تم البث", description: `أُرسلت إلى ${data.queued} مجموعة` });
        setLastResult(data);
        setMessage("");
      },
      onError: (e: Error) => {
        toast({ title: "❌ فشل البث", description: e.message, variant: "destructive" });
      },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="nex-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: ".88rem", fontWeight: 800, color: "#a8d4ff" }}>📡 بث رسالة لجميع المجموعات</div>
          <div style={{ fontSize: ".72rem", color: activeCount > 0 ? "#30d988" : "#8892b0", background: "rgba(255,255,255,.05)", borderRadius: 6, padding: "3px 10px" }}>
            {activeCount} مجموعة نشطة
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div className="nex-lbl">الرسالة</div>
            <textarea
              className="nex-textarea"
              rows={5}
              placeholder="اكتب رسالة البث هنا... ستُرسَل لجميع المجموعات النشطة"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ direction: "rtl" }}
            />
          </div>
          <button
            className="nex-btn nex-btn-primary"
            onClick={send}
            disabled={broadcast.isPending || !message.trim() || activeCount === 0}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {broadcast.isPending
              ? "جارٍ البث…"
              : activeCount === 0
                ? "⚠️ لا توجد مجموعات نشطة"
                : `📡 بث إلى ${activeCount} مجموعة`}
          </button>
        </div>
      </div>

      {lastResult && (
        <div className="nex-card" style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: ".78rem", fontWeight: 700, color: "#30d988", marginBottom: 8 }}>
            ✅ تم البث إلى {lastResult.queued} مجموعة
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {lastResult.threadIDs.map(tid => (
              <span key={tid} style={{ fontSize: ".68rem", fontFamily: "monospace", background: "rgba(255,255,255,.06)", borderRadius: 5, padding: "2px 8px", color: "#5aadff" }}>
                {tid}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="nex-card" style={{ padding: "14px 18px" }}>
        <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#8892b0", marginBottom: 6 }}>
          💡 كيف يعمل البث؟
        </div>
        <div style={{ fontSize: ".72rem", color: "#3f4a68", lineHeight: 1.7 }}>
          تُرسَل الرسالة من حساب البوت إلى جميع المجموعات التي سجّل فيها نشاطاً.
          يتم الإرسال بشكل متتالٍ خلال ثوانٍ قليلة.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations Tab — combines Broadcast, Send, Scheduler, Control in sub-tabs
// ─────────────────────────────────────────────────────────────────────────────
type OpsSubTab = "broadcast" | "send" | "scheduler" | "control";

function OperationsTab() {
  const [sub, setSub] = useState<OpsSubTab>("broadcast");
  return (
    <div style={{ direction: "rtl", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {([
          { id: "broadcast" as OpsSubTab, label: "بث",      icon: "📡" },
          { id: "send"      as OpsSubTab, label: "إرسال",   icon: "📨" },
          { id: "scheduler" as OpsSubTab, label: "الجدولة", icon: "⏰" },
          { id: "control"   as OpsSubTab, label: "التحكم",  icon: "🎛️" },
        ]).map(t => (
          <button
            key={t.id}
            className={`nex-tab ${sub === t.id ? "active" : ""}`}
            style={{ padding: "5px 14px", fontSize: ".76rem", display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => setSub(t.id)}
          >
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>
      {sub === "broadcast" && <BroadcastTab />}
      {sub === "send"      && <SendTab />}
      {sub === "scheduler" && <SchedulerTab />}
      {sub === "control"   && <ControlTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard root
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const { data: status } = useBotStatus();
  const online = !!status?.running;

  return (
    <div style={{ direction: "rtl", minHeight: "100vh", padding: "16px", maxWidth: 920, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(145deg, #3d9eff 0%, #9b72f7 100%)",
            borderRadius: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 900, color: "#fff",
            boxShadow: "0 0 18px rgba(61,158,255,.3)",
          }}>N</div>
          <div>
            <div style={{ fontSize: ".9rem", fontWeight: 800, background: "linear-gradient(90deg, #a8d4ff, #c5b0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Nexus Panel
            </div>
            <div style={{ fontSize: ".6rem", color: "#3f4a68", marginTop: 1 }}>لوحة تحكم البوت</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={`nex-dot ${online ? "nex-dot-online" : "nex-dot-offline"}`} />
          <span style={{ fontSize: ".72rem", fontWeight: 700, color: online ? "var(--nex-green)" : "var(--nex-red)" }}>
            {online ? "متصل" : "غير متصل"}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="nex-tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nex-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "overview"   && <OverviewTab />}
        {tab === "logs"       && <LogsTab />}
        {tab === "commands"   && <CommandsTab />}
        {tab === "cookies"    && <CookiesTab />}
        {tab === "operations" && <OperationsTab />}
        {tab === "config"     && <ConfigTab />}
      </div>
    </div>
  );
}
