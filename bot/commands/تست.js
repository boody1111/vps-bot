module.exports = {
  name: "تست",
  aliases: ["test", "apitest", "debugapi"],
  description: "قائمة بجميع دوال الـ api المتاحة",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const fns = Object.keys(api).filter(k => typeof api[k] === "function").sort();
    const props = Object.keys(api).filter(k => typeof api[k] !== "function").sort();
    api.sendMessage(
      `🔧 تست API\n━━━━━━━━━━━━━\n` +
      `📦 الدوال (${fns.length}):\n${fns.join(", ")}\n\n` +
      `📋 الخصائص (${props.length}):\n${props.join(", ")}`,
      threadID
    );
  }
};
