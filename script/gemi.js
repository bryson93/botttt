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

  // Send waiting message
  const waitingMessage = await api.sendMessage(
    "⏳ Gemini is thinking... Please wait a moment.",
    threadID
  );

  try {
    const res = await axios.get("https://api-library-kohi.onrender.com/api/gemini", {
      params: { prompt }
    });

    let responseData = res.data;
    
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        console.error("[gemini.js] JSON Parse Error:", parseError);
      }
    }

    const answer = responseData?.data || responseData?.response || responseData;

    if (!answer) {
      // Delete waiting message and send error
      api.unsendMessage(waitingMessage.messageID);
      return api.sendMessage(
        "⚠️ No response received from Gemini. Try again later.",
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
      // Split the answer into chunks
      for (let i = 0; i < answer.length; i += maxLength) {
        const chunk = answer.substring(i, i + maxLength);
        if (i === 0) {
          messageParts.push(`🤖 𝗚𝗲𝗺𝗶𝗻𝗶 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${chunk}`);
        } else {
          messageParts.push(chunk);
        }
      }
    } else {
      messageParts.push(`🤖 𝗚𝗲𝗺𝗶𝗻𝗶 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n\n${answer}`);
    }

    // Send all message parts
    for (const part of messageParts) {
      await api.sendMessage(part, threadID);
    }

  } catch (err) {
    console.error("[gemini.js] API Error:", err.response?.data || err.message);
    
    // Delete waiting message and send error
    api.unsendMessage(waitingMessage.messageID);
    return api.sendMessage(
      "🚫 Failed to reach Gemini API. Please try again later.",
      threadID,
      messageID
    );
  }
};
