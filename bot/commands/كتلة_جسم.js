module.exports = {
  name: "كتلة_جسم",
  aliases: ["bmi", "جسم", "وزن"],
  description: "حساب مؤشر كتلة الجسم (BMI)",
  adminOnly: false,
  execute(api, event, args, settings, state) {
    const { threadID } = event;
    const weight = parseFloat(args[0]);
    const height = parseFloat(args[1]);
    if (!weight || !height || isNaN(weight) || isNaN(height)) {
      return api.sendMessage("⚠️ الاستخدام: كتلة_جسم [الوزن بالكيلو] [الطول بالسم]\nمثال: كتلة_جسم 70 175", threadID);
    }
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    let status, emoji;
    if (bmi < 18.5) { status = "نحافة مفرطة"; emoji = "⚠️"; }
    else if (bmi < 25) { status = "وزن مثالي"; emoji = "✅"; }
    else if (bmi < 30) { status = "زيادة في الوزن"; emoji = "🟡"; }
    else { status = "سمنة"; emoji = "🔴"; }

    const idealMin = (18.5 * heightM * heightM).toFixed(1);
    const idealMax = (24.9 * heightM * heightM).toFixed(1);

    api.sendMessage(
      `💪 مؤشر كتلة الجسم\n━━━━━━━━━━━━━\n` +
      `⚖️ الوزن: ${weight} كغ\n📏 الطول: ${height} سم\n` +
      `━━━━━━━━━━━━━\n📊 الـ BMI: ${bmi.toFixed(2)}\n${emoji} الحالة: ${status}\n` +
      `✅ الوزن المثالي: ${idealMin} - ${idealMax} كغ`,
      threadID
    );
  }
};
