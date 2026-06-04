const https = require("https");

function fetchPrice(symbol) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("parse")); } });
    }).on("error", reject);
  });
}

const COINS = { BTC: "بيتكوين", ETH: "إيثريوم", BNB: "بينانس كوين", SOL: "سولانا", DOGE: "دوجكوين" };

module.exports = {
  name: "عملة",
  aliases: ["crypto", "btc", "كريبتو"],
  description: "أسعار العملات الرقمية الحية من Binance",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const sym = (args[0] || "BTC").toUpperCase().replace(/USDT$/, "");
    const name = COINS[sym] || sym;
    try {
      const d = await fetchPrice(sym);
      if (d.code) return api.sendMessage(`❌ عملة غير موجودة: ${sym}`, threadID);
      const price = parseFloat(d.lastPrice).toLocaleString("en-US", { maximumFractionDigits: 4 });
      const change = parseFloat(d.priceChangePercent);
      const arrow = change >= 0 ? "📈" : "📉";
      const vol = parseFloat(d.quoteVolume / 1e6).toFixed(2);
      api.sendMessage(
        `💰 ${name} (${sym}/USDT)\n━━━━━━━━━━━━━\n` +
        `💵 السعر: $${price}\n` +
        `${arrow} التغيير (24h): ${change >= 0 ? "+" : ""}${change.toFixed(2)}%\n` +
        `📊 الحجم (24h): $${vol}M`,
        threadID
      );
    } catch {
      api.sendMessage("❌ فشل الاتصال بـ Binance. حاول لاحقاً.", threadID);
    }
  }
};
