const https = require("https");

function fetchWeather(city) {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=ar`;
    https.get(url, { headers: { "User-Agent": "curl/7.68.0" } }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { reject(new Error("parse")); } });
    }).on("error", reject);
  });
}

module.exports = {
  name: "طقس_مدينة",
  aliases: ["weather", "طقس", "الطقس"],
  description: "الطقس الحالي لأي مدينة",
  adminOnly: false,
  async execute(api, event, args, settings, state) {
    const { threadID } = event;
    const city = args.join(" ");
    if (!city) return api.sendMessage("⚠️ الاستخدام: طقس_مدينة [اسم المدينة]\nمثال: طقس_مدينة الرياض", threadID);
    try {
      const data = await fetchWeather(city);
      const current = data.current_condition[0];
      const area = data.nearest_area?.[0];
      const cityName = area?.areaName?.[0]?.value || city;
      const country = area?.country?.[0]?.value || "";
      const temp = current.temp_C;
      const feel = current.FeelsLikeC;
      const desc = current.lang_ar?.[0]?.value || current.weatherDesc?.[0]?.value || "";
      const humidity = current.humidity;
      const wind = current.windspeedKmph;
      const visibility = current.visibility;

      const condIcons = { Clear: "☀️", Sunny: "☀️", Overcast: "☁️", Cloudy: "🌤", Rain: "🌧️", Snow: "❄️", Thunder: "⛈️", Fog: "🌫️", Mist: "🌫️" };
      const icon = Object.entries(condIcons).find(([k]) => desc.toLowerCase().includes(k.toLowerCase()))?.[1] || "🌡️";

      api.sendMessage(
        `${icon} طقس ${cityName}، ${country}\n━━━━━━━━━━━━━\n` +
        `🌡️ الحرارة: ${temp}°C (تشعر بـ ${feel}°C)\n` +
        `☁️ الحالة: ${desc}\n` +
        `💧 الرطوبة: ${humidity}%\n` +
        `💨 الرياح: ${wind} كم/س\n` +
        `👁️ الرؤية: ${visibility} كم`,
        threadID
      );
    } catch {
      api.sendMessage("❌ لم يُعثر على المدينة أو فشل الاتصال.", threadID);
    }
  }
};
