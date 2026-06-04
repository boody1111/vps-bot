module.exports = {
  name: "أصدقاء",
  aliases: ["friends", "صديق", "friendlist"],
  description: "عرض قائمة أصدقاء البوت",
  adminOnly: true,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    try {
      let friendList = [];
      if (typeof api.getFriendsList === "function") {
        friendList = await new Promise((res, rej) => api.getFriendsList((err, d) => err ? rej(err) : res(d)));
      }
      const count = Array.isArray(friendList) ? friendList.length : Object.keys(friendList).length;
      api.sendMessage(`👥 قائمة الأصدقاء\n━━━━━━━━━━━━━\n📊 إجمالي الأصدقاء: ${count}`, threadID);
    } catch {
      api.sendMessage("❌ فشل جلب قائمة الأصدقاء.", threadID);
    }
  }
};
