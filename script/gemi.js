const axios = require("axios");

module.exports.config = {
  name: "gemini",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Vern",
  description: "Ask the Gemini AI a question and get a thoughtful answer.",
  commandCategory: "ai",
  usages: "gemini [question]",
  cooldowns: 5,
  role: 0,
  hasPrefix: true
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage(
      "❓ Please provide a question to ask Gemini.\n\nUsage: gemini What is love?",
      threadID,
      messageID
    );
  }

  try {
    // Fetch from the new Gemini API
    const apiUrl = `https://api-library-kohi.onrender.com/api/gemini?prompt=${encodeURIComponent(prompt)}`;
    
    console.log("[gemini.js] Making API request to:", apiUrl);
    
    const res = await axios.get(apiUrl);
    
    console.log("[gemini.js] API Response:", JSON.stringify(res.data, null, 2));

    // Check different possible response structures
    let answer = res.data?.response || res.data?.answer || res.data?.content || res.data?.message || res.data;

    if (typeof answer === 'object') {
      answer = JSON.stringify(answer);
    }

    if (!answer || answer.trim() === "") {
      return api.sendMessage(
        "⚠️ No response received from Gemini. Try again later.",
        threadID,
        messageID
      );
    }

    // Trim if too long
    const maxLen = 2000;
    const output = answer.length > maxLen ? answer.slice(0, maxLen) + "..." : answer;

    return api.sendMessage(
      `🤖 𝗚𝗲𝗺𝗶𝗻𝗶 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${output}`,
      threadID,
      messageID
    );
  } catch (err) {
    console.error("[gemini.js] API Error:", err.response?.data || err.message);
    return api.sendMessage(
      "🚫 Failed to reach Gemini API. Please try again later.",
      threadID,
      messageID
    );
  }
};
