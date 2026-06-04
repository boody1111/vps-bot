module.exports = {
  name: "صامت",
  aliases: ["silent", "mute", "وضع_الصمت"],
  description: "تبديل وضع الصمت — البوت يكتفي بالسجل دون الرد",
  adminOnly: true,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    if (!state.silentMode) state.silentMode = {};
    state.silentMode[threadID] = !state.silentMode[threadID];
    const active = state.silentMode[threadID];
    api.sendMessage(
      active
        ? "🔇 وضع الصمت مفعّل — البوت لن يرد على الرسائل في هذه المحادثة."
        : "🔊 وضع الصمت مُعطَّل — البوت عاد للعمل الطبيعي.",
      threadID
    );
  }
};
