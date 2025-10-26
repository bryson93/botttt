const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermission: 0,
  credits: "bryson",
  description: "Ask the AI a question and get a response.",
  commandCategory: "ai",
  usages: "ai [question]",
  cooldowns: 5,
  role: 0,
  hasPrefix: false
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage(
      "❓ Please provide a question to ask AI.\n\nUsage: ai What is your name?",
      threadID,
      messageID
    );
  }

  // Send waiting message
  const waitingMessage = await api.sendMessage(
    "⏳ AI is thinking... Please wait a moment.",
    threadID
  );

  try {
    const apiUrl = `https://arychauhann.onrender.com/api/gpt5?prompt=${encodeURIComponent(prompt)}&uid=&reset=`;
    
    const res = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    let responseData = res.data;
    
    // Parse the response if it's a JSON string
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        console.error("[ai.js] JSON Parse Error:", parseError);
      }
    }

    // Extract the actual response text from the result field
    const answer = responseData?.result || responseData?.response || responseData?.answer || responseData?.data || responseData?.message || responseData;

    if (!answer || answer.trim() === "") {
      api.unsendMessage(waitingMessage.messageID);
      return api.sendMessage(
        "⚠️ No response received from AI. Try again later.",
        threadID,
        messageID
      );
    }

    // Delete the waiting message
    api.unsendMessage(waitingMessage.messageID);

    // Split long messages if they exceed Facebook's limit (~2000 characters)
    const messageParts = [];
    const maxLength = 2000;
    
    if (answer.length > maxLength) {
      for (let i = 0; i < answer.length; i += maxLength) {
        const chunk = answer.substring(i, i + maxLength);
        if (i === 0) {
          messageParts.push(`🤖 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${chunk}`);
        } else {
          messageParts.push(chunk);
        }
      }
    } else {
      messageParts.push(`🤖 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${answer}`);
    }

    // Send all message parts
    for (const part of messageParts) {
      await api.sendMessage(part, threadID);
    }

  } catch (err) {
    console.error("[ai.js] API Error:", err.message);
    
    api.unsendMessage(waitingMessage.messageID);
    return api.sendMessage(
      "🚫 Failed to reach AI API. Please try again later.",
      threadID,
      messageID
    );
  }
};
