const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "qrgen",
  aliases: ["qr", "باركود", "qrcode"],
  description: "توليد رمز QR من نص أو رابط",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const text = args.join(" ");
    if (!text) return api.sendMessage("⚠️ الاستخدام: qrgen [نص أو رابط]", threadID);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    const tmpPath = path.join(os.tmpdir(), `qr_${Date.now()}.png`);
    const file = fs.createWriteStream(tmpPath);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        fs.unlink(tmpPath, () => {});
        return api.sendMessage("❌ فشل توليد QR.", threadID);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        api.sendMessage({
          body: `📱 رمز QR لـ: ${text.slice(0, 50)}`,
          attachment: fs.createReadStream(tmpPath)
        }, threadID, () => { try { fs.unlinkSync(tmpPath); } catch {} });
      });
    }).on("error", err => {
      fs.unlink(tmpPath, () => {});
      api.sendMessage(`❌ فشل الاتصال: ${err.message}`, threadID);
    });
  }
};
