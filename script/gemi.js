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
    const res = await axios.get("https://api-library-kohi.onrender.com/api/gemini", {
      params: { prompt }
    });

    // Parse the response if it's a JSON string
    let responseData = res.data;
    
    // If the response is a string, try to parse it as JSON
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        console.error("[gemini.js] JSON Parse Error:", parseError);
      }
    }

    // Extract the actual response text
    const answer = responseData?.data || responseData?.response || responseData;

    if (!answer) {
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
