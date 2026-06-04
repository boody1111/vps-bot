const { registerReplyHandler } = require("../handler");

const SUITS = ["♠️","♥️","♦️","♣️"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const VALUES = { A:11, J:10, Q:10, K:10 };

function cardVal(rank) { return VALUES[rank] ?? parseInt(rank); }
function deckVal(hand) {
  let t = hand.reduce((s, c) => s + cardVal(c.rank), 0);
  let aces = hand.filter(c => c.rank === "A").length;
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}
function draw(deck) { return deck.splice(Math.floor(Math.random() * deck.length), 1)[0]; }
function makeDeck() { return SUITS.flatMap(s => RANKS.map(r => ({ suit: s, rank: r }))); }
function showHand(hand) { return hand.map(c => `${c.suit}${c.rank}`).join(" "); }

function startGame(api, threadID, senderID, player, dealer, deck) {
  const pVal = deckVal(player);

  function makeHandler(player, dealer, deck) {
    return (api, ev) => {
      const cmd = (ev.body || "").trim().toLowerCase();
      if (cmd === "هيت" || cmd === "hit" || cmd === "ورقة") {
        player.push(draw(deck));
        const pVal = deckVal(player);
        if (pVal > 21) {
          api.sendMessage(`🃏 ورقك: ${showHand(player)} (${pVal})\n💥 تجاوزت 21! خسرت.`, threadID);
          return;
        }
        if (pVal === 21) {
          while (deckVal(dealer) < 17) dealer.push(draw(deck));
          const dVal = deckVal(dealer);
          const result = dVal > 21 ? "🏆 الديلر تجاوز 21! فزت!" : pVal > dVal ? "🏆 فزت!" : pVal < dVal ? "💀 الديلر فاز!" : "🤝 تعادل!";
          api.sendMessage(`🃏 ورقك: ${showHand(player)} (${pVal})\nورق الديلر: ${showHand(dealer)} (${dVal})\n${result}`, threadID);
          return;
        }
        api.sendMessage(`🃏 ورقك: ${showHand(player)} (${pVal})\nورق الديلر: ${dealer[0].suit}${dealer[0].rank} 🂠\n↩️ هيت أو وقف`, threadID);
        registerReplyHandler(threadID, senderID, makeHandler(player, dealer, deck), 90000);
        return;
      }
      if (cmd === "وقف" || cmd === "stand" || cmd === "stop") {
        while (deckVal(dealer) < 17) dealer.push(draw(deck));
        const pVal = deckVal(player);
        const dVal = deckVal(dealer);
        const result = dVal > 21 ? "🏆 الديلر تجاوز 21! فزت!" : pVal > dVal ? "🏆 فزت!" : pVal < dVal ? "💀 الديلر فاز!" : "🤝 تعادل!";
        api.sendMessage(`🃏 ورقك: ${showHand(player)} (${pVal})\nورق الديلر: ${showHand(dealer)} (${dVal})\n${result}`, threadID);
        return;
      }
      api.sendMessage("↩️ اكتب هيت (ورقة جديدة) أو وقف (انهِ)", threadID);
      registerReplyHandler(threadID, senderID, makeHandler(player, dealer, deck), 90000);
    };
  }

  if (pVal === 21) {
    api.sendMessage(`🃏 بلاك جاك!\nورقك: ${showHand(player)} (${pVal})\n🏆 بلاك جاك! فزت فوراً!`, threadID);
    return;
  }

  api.sendMessage(
    `🃏 بلاك جاك\n━━━━━━━━━━━━━\nورقك: ${showHand(player)} (${pVal})\nورق الديلر: ${dealer[0].suit}${dealer[0].rank} 🂠\n━━━━━━━━━━━━━\n↩️ هيت (ورقة جديدة) أو وقف (انهِ)`,
    threadID
  );
  registerReplyHandler(threadID, senderID, makeHandler(player, dealer, deck), 120000);
}

module.exports = {
  name: "بطاقة",
  aliases: ["blackjack", "bj", "بلاك_جاك"],
  description: "لعبة بلاك جاك — اقترب من 21 دون تجاوزه",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    const deck = makeDeck().sort(() => Math.random() - 0.5);
    const player = [draw(deck), draw(deck)];
    const dealer = [draw(deck), draw(deck)];
    startGame(api, threadID, senderID, player, dealer, deck);
  }
};
