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
    // Direct URL construction for the new API
    const apiUrl = `https://api-library-kohi.onrender.com/api/gemini?prompt=${encodeURIComponent(prompt)}`;
    
    const res = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Try to extract response from different possible structures
    let answer;
    
    if (typeof res.data === 'string') {
      answer = res.data;
    } else if (res.data.response) {
      answer = res.data.response;
    } else if (res.data.answer) {
      answer = res.data.answer;
    } else if (res.data.content) {
      answer = res.data.content;
    } else if (res.data.message) {
      answer = res.data.message;
    } else {
      answer = JSON.stringify(res.data);
    }

    if (!answer || answer.trim() === "") {
      return api.sendMessage(
        "⚠️ No response received from Gemini. The API returned empty content.",
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
    console.error("[gemini.js] API Error:", err);
    return api.sendMessage(
      `🚫 Error: ${err.message}`,
      threadID,
      messageID
    );
  }
};
