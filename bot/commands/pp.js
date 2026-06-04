const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

module.exports = {
  name: "pp",
  aliases: ["صورة_بروفايل", "avatar", "pfp"],
  description: "عرض صورة بروفايل مستخدم",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID, senderID, mentions, messageReply } = event;
    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs[0] || messageReply?.senderID || senderID;

    try {
      const imgUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7C4f6890b3a1f8f5fb84e3ddc45aae3aaf`;
      const tmpPath = path.join(os.tmpdir(), `pp_${targetID}.jpg`);

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpPath);
        https.get(imgUrl, res => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          res.pipe(file);
          file.on("finish", () => { file.close(); resolve(); });
        }).on("error", reject);
      });

      const info = await api.getUserInfo(targetID);
      const name = info?.[targetID]?.name || "المستخدم";

      api.sendMessage({
        body: `📸 صورة بروفايل ${name}`,
        attachment: fs.createReadStream(tmpPath)
      }, threadID, () => {
        try { fs.unlinkSync(tmpPath); } catch {}
      });
    } catch (e) {
      api.sendMessage(`❌ فشل جلب الصورة: ${e.message}`, threadID);
    }
  }
};
