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
  hasPrefix: true
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
    // Try different API approaches
    const apiUrl = `https://arychauhann.onrender.com/api/gpt5?prompt=${encodeURIComponent(prompt)}&uid=&reset=`;
    
    console.log("[ai.js] Making API request to:", apiUrl);
    
    const res = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    console.log("[ai.js] API Response status:", res.status);
    console.log("[ai.js] API Response data:", res.data);

    let responseData = res.data;
    
    // Parse the response if it's a JSON string
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        console.error("[ai.js] JSON Parse Error:", parseError);
        // If it's not JSON, use the string directly
      }
    }

    // Extract the actual response text - try different possible keys
    let answer = responseData?.response || responseData?.answer || responseData?.data || 
                 responseData?.message || responseData?.content || responseData?.text || 
                 responseData;

    // If answer is still an object, stringify it
    if (typeof answer === 'object' && answer !== null) {
      answer = JSON.stringify(answer);
    }

    if (!answer || answer.trim() === "") {
      // Delete waiting message and send error
      api.unsendMessage(waitingMessage.messageID);
      return api.sendMessage(
        "⚠️ No response received from AI. The API returned empty content.",
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
    console.error("[ai.js] API Error Details:");
    console.error("Error Message:", err.message);
    console.error("Error Code:", err.code);
    console.error("Response Status:", err.response?.status);
    console.error("Response Data:", err.response?.data);
    
    // Delete waiting message and send error
    api.unsendMessage(waitingMessage.messageID);
    
    let errorMessage = "🚫 Failed to reach AI API. Please try again later.";
    
    if (err.code === 'ECONNREFUSED') {
      errorMessage = "🚫 Cannot connect to AI API. The server might be down.";
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = "🚫 AI API request timed out. Please try again.";
    } else if (err.response?.status === 404) {
      errorMessage = "🚫 AI API endpoint not found. The API might have changed.";
    } else if (err.response?.status === 500) {
      errorMessage = "🚫 AI API server error. Please try again later.";
    }
    
    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
