const fs = require("fs");
const path = require("path");
const DATA_DIR = process.env.BOT_DIR || __dirname.replace(/\/commands$/, "");
const SLOT_FILE = path.join(DATA_DIR, "slot.json");
const STARTING = 500;
const SYMS = ["🍎","🍌","🍒","⭐","7️⃣","🍇","🔔"];

function load() {
  try { if (fs.existsSync(SLOT_FILE)) return JSON.parse(fs.readFileSync(SLOT_FILE, "utf8")); } catch {}
  return {};
}
function save(d) { try { fs.writeFileSync(SLOT_FILE, JSON.stringify(d, null, 2)); } catch {} }
function getBal(d, uid) { return typeof d[uid]?.balance === "number" ? d[uid].balance : STARTING; }
function setBal(d, uid, bal) { if (!d[uid]) d[uid] = {}; d[uid].balance = bal; }

module.exports = {
  name: "slot",
  aliases: ["سلوت", "قمار"],
  description: "لعبة السلوت — راهن وجرّب حظك",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const d = load();

    if (args[0] === "رصيد" || args[0] === "balance") {
      return api.sendMessage(`💰 رصيدك: ${getBal(d, senderID).toLocaleString()} $`, threadID);
    }

    if (args[0] === "top" || args[0] === "أثرى") {
      const sorted = Object.entries(d)
        .filter(([, v]) => typeof v.balance === "number")
        .sort(([, a], [, b]) => b.balance - a.balance).slice(0, 10);
      if (!sorted.length) return api.sendMessage("📊 لا توجد بيانات بعد.", threadID);
      const lines = sorted.map(([uid, v], i) => `${i + 1}. ${uid}: ${v.balance.toLocaleString()} $`);
      return api.sendMessage(`🏆 أثرى اللاعبين:\n${lines.join("\n")}`, threadID);
    }

    const bet = parseInt(args[0]);
    if (!bet || bet <= 0 || isNaN(bet)) {
      return api.sendMessage(
        `🎰 السلوت\n━━━━━━━━━━━━━\nالاستخدام: slot [مبلغ]\nرصيدك: ${getBal(d, senderID).toLocaleString()} $\n\nأوامر: slot رصيد | slot top`,
        threadID
      );
    }

    let bal = getBal(d, senderID);
    if (bal < bet) return api.sendMessage(`❌ رصيدك غير كافٍ! (${bal.toLocaleString()} $)`, threadID);

    const reels = [
      SYMS[Math.floor(Math.random() * SYMS.length)],
      SYMS[Math.floor(Math.random() * SYMS.length)],
      SYMS[Math.floor(Math.random() * SYMS.length)],
    ];

    const allSame = reels[0] === reels[1] && reels[1] === reels[2];
    const twoSame = reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
    const isJackpot = allSame && reels[0] === "7️⃣";

    let winMult = 0;
    if (isJackpot) winMult = 10;
    else if (allSame) winMult = 3;
    else if (twoSame) winMult = 1.5;

    let newBal;
    let resultMsg;

    if (winMult > 0) {
      const won = Math.floor(bet * winMult);
      newBal = bal - bet + won;
      resultMsg = isJackpot
        ? `🎊 JACKPOT! ربحت ${won.toLocaleString()} $ (×${winMult})!`
        : allSame
        ? `🎉 فزت! ربحت ${won.toLocaleString()} $ (×${winMult})`
        : `✅ مطابقتان! استعدت ${won.toLocaleString()} $`;
    } else {
      newBal = bal - bet;
      resultMsg = `💀 خسرت ${bet.toLocaleString()} $`;
    }

    setBal(d, senderID, newBal);
    save(d);

    api.sendMessage(
      `🎰 السلوت\n━━━━━━━━━━━━━\n${reels.join(" | ")}\n━━━━━━━━━━━━━\n${resultMsg}\n💰 رصيدك الآن: ${newBal.toLocaleString()} $`,
      threadID
    );
  }
};
