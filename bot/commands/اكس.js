const { registerReplyHandler } = require("../handler");

const SYM = { X: "❌", O: "⭕", _: "▫️" };
const POS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];
const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function renderBoard(b) {
  const cells = b.map((c, i) => c === "_" ? POS[i] : SYM[c]);
  return `${cells[0]} ${cells[1]} ${cells[2]}\n${cells[3]} ${cells[4]} ${cells[5]}\n${cells[6]} ${cells[7]} ${cells[8]}`;
}

function checkWin(b) {
  for (const [a, bI, c] of WINS) {
    if (b[a] !== "_" && b[a] === b[bI] && b[a] === b[c]) return b[a];
  }
  return b.every(c => c !== "_") ? "draw" : null;
}

async function getName(api, uid) {
  try { const i = await api.getUserInfo(uid); return i?.[uid]?.name || "لاعب"; } catch { return "لاعب"; }
}

module.exports = {
  name: "اكس",
  aliases: ["xo", "ttt", "tic_tac_toe"],
  description: "لعبة X-O لاعبين — رد برقم 1-9",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID, mentions } = event;
    const oppID = Object.keys(mentions || {})[0];
    if (!oppID || oppID === senderID) return api.sendMessage("⚠️ منشن لاعب ثانٍ.\nمثال: اكس @مستخدم", threadID);

    const [n1, n2] = await Promise.all([getName(api, senderID), getName(api, oppID)]);
    const board = ["_","_","_","_","_","_","_","_","_"];
    const players = { X: senderID, O: oppID };
    const names = { X: n1, O: n2 };
    let turn = "X";

    function sendBoard(msg = "") {
      const t = turn;
      api.sendMessage(
        `🎮 X-O\n━━━━━━━━━━━━━\n${SYM.X} ${names.X} vs ${SYM.O} ${names.O}\n━━━━━━━━━━━━━\n${renderBoard(board)}\n━━━━━━━━━━━━━\n${msg || `الدور: ${SYM[t]} ${names[t]}`}\n↩️ رد برقم الخانة (1-9)`,
        threadID
      );
    }

    function makeHandler() {
      return (api, ev) => {
        if (ev.senderID !== players[turn]) return;
        const pos = parseInt((ev.body || "").trim()) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8 || board[pos] !== "_") {
          api.sendMessage(`⚠️ خانة غير صالحة. اختر من 1-9.`, threadID);
          registerReplyHandler(threadID, "*", makeHandler(), 120000, false);
          return;
        }
        board[pos] = turn;
        const winner = checkWin(board);
        if (winner === "draw") {
          api.sendMessage(`${renderBoard(board)}\n🤝 تعادل!`, threadID);
          return;
        }
        if (winner) {
          api.sendMessage(`${renderBoard(board)}\n🏆 ${names[winner]} فاز!`, threadID);
          return;
        }
        turn = turn === "X" ? "O" : "X";
        sendBoard();
        registerReplyHandler(threadID, "*", makeHandler(), 120000, false);
      };
    }

    sendBoard();
    registerReplyHandler(threadID, "*", makeHandler(), 120000, false);
  }
};
