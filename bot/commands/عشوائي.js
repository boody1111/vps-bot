module.exports = {
  name: "عشوائي",
  aliases: ["random", "اختار", "pick"],
  description: "اختيار عشوائي من قائمة أو رقم عشوائي",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    if (!args.length) return api.sendMessage("⚠️ الاستخدام:\n• عشوائي [خيار1] [خيار2] ...\n• عشوائي رقم [من] [إلى]", threadID);
    if (args[0] === "رقم" || args[0] === "num") {
      const min = parseInt(args[1]) || 1;
      const max = parseInt(args[2]) || 100;
      if (min >= max) return api.sendMessage("❌ يجب أن يكون الحد الأدنى أصغر من الأقصى.", threadID);
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      return api.sendMessage(`🎲 الرقم العشوائي (${min}-${max}):\n🎯 ${num}`, threadID);
    }
    const items = args.join(" ").split(/[,،|]/).map(s => s.trim()).filter(Boolean);
    if (items.length < 2) return api.sendMessage("⚠️ أدخل خيارين على الأقل مفصولة بفواصل.", threadID);
    const chosen = items[Math.floor(Math.random() * items.length)];
    api.sendMessage(
      `🎯 الاختيار العشوائي\n━━━━━━━━━━━━━\n📋 الخيارات (${items.length}):\n${items.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n━━━━━━━━━━━━━\n✅ الفائز: ${chosen}`,
      threadID
    );
  }
};
