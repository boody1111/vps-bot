module.exports = {
  name: "صوّت",
  aliases: ["vote_for", "اختار_خيار"],
  description: "التصويت لخيار في التصويت الجاري",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID, senderID } = event;
    if (!global.nexusPolls) return api.sendMessage("⚠️ لا يوجد تصويت نشط.", threadID);
    const poll = global.nexusPolls.get(threadID);
    if (!poll) return api.sendMessage("⚠️ لا يوجد تصويت نشط في هذه المجموعة.", threadID);
    if (poll.voters.has(senderID)) return api.sendMessage("⚠️ لقد صوّتت بالفعل!", threadID);
    const choice = parseInt(args[0]) - 1;
    if (isNaN(choice) || choice < 0 || choice >= poll.options.length) {
      return api.sendMessage(`⚠️ اختر رقماً بين 1 و ${poll.options.length}.`, threadID);
    }
    poll.votes[choice] = (poll.votes[choice] || 0) + 1;
    poll.voters.add(senderID);
    api.sendMessage(`✅ تم تسجيل صوتك لـ: "${poll.options[choice]}"`, threadID);
  }
};
