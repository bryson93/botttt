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
      "🌟 𝗔𝗜 𝗔𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝘁\n━━━━━━━━━━━━━━━━━━\n❓ Please provide a question to ask AI.\n\n💡 𝗨𝘀𝗮𝗴𝗲: ai What is your name?\n━━━━━━━━━━━━━━━━━━\n✨ Powered by GPT-5",
      threadID,
      messageID
    );
  }

  // Send waiting message with design
  const waitingMessage = await api.sendMessage(
    "🕒 𝗣𝗿𝗼𝗰𝗲𝘀𝘀𝗶𝗻𝗴 𝗥𝗲𝗾𝘂𝗲𝘀𝘁\n━━━━━━━━━━━━━━━━━━\n⏳ AI is analyzing your question...\n📝 Please wait a moment while I generate the best response.\n━━━━━━━━━━━━━━━━━━\n✨ Thinking deeply...",
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
      // Edit waiting message to show error
      return api.editMessage(
        "⚠️ 𝗘𝗿𝗿𝗼𝗿 𝗢𝗰𝗰𝘂𝗿𝗿𝗲𝗱\n━━━━━━━━━━━━━━━━━━\n❌ No response received from AI.\n🔧 Please try again later or rephrase your question.\n━━━━━━━━━━━━━━━━━━\n💫 Still here to help!",
        waitingMessage.messageID
      );
    }

    // Create beautiful response design
    const createResponseBox = (text, isFirst = true) => {
      const header = isFirst ? 
        "🤖 𝗔𝗜 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲\n━━━━━━━━━━━━━━━━━━\n" : 
        "↳ 𝗖𝗼𝗻𝘁𝗶𝗻𝘂𝗲𝗱\n━━━━━━━━━━━━━━━━━━\n";
      
      const footer = isFirst ? 
        "\n━━━━━━━━━━━━━━━━━━\n💡 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗚𝗣𝗧-5 | ✨ 𝗕𝘆 𝗕𝗿𝘆𝘀𝗼𝗻" : 
        "\n━━━━━━━━━━━━━━━━━━";
      
      return `${header}${text}${footer}`;
    };

    // Split long messages if they exceed Facebook's limit (~2000 characters)
    const messageParts = [];
    const maxLength = 1800; // Reduced to account for design elements
    
    if (answer.length > maxLength) {
      for (let i = 0; i < answer.length; i += maxLength) {
        const chunk = answer.substring(i, i + maxLength);
        messageParts.push(createResponseBox(chunk, i === 0));
      }
    } else {
      messageParts.push(createResponseBox(answer, true));
    }

    // Edit the waiting message with the first part of response
    await api.editMessage(messageParts[0], waitingMessage.messageID);

    // Send additional parts as new messages if needed
    if (messageParts.length > 1) {
      for (let i = 1; i < messageParts.length; i++) {
        await api.sendMessage(messageParts[i], threadID);
        // Add small delay between messages for better UX
        if (i < messageParts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

  } catch (err) {
    console.error("[ai.js] API Error:", err.message);
    
    let errorDesign = "";
    
    if (err.code === 'ECONNREFUSED') {
      errorDesign = "🌐 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻 𝗘𝗿𝗿𝗼𝗿\n━━━━━━━━━━━━━━━━━━\n❌ Cannot connect to AI service.\n🔧 The server might be temporarily down.\n━━━━━━━━━━━━━━━━━━\n🔄 Please try again in a few moments.";
    } else if (err.code === 'ETIMEDOUT') {
      errorDesign = "⏰ 𝗧𝗶𝗺𝗲𝗼𝘂𝘁 𝗘𝗿𝗿𝗼𝗿\n━━━━━━━━━━━━━━━━━━\n⏳ Request took too long to process.\n💭 The AI might be thinking too deeply!\n━━━━━━━━━━━━━━━━━━\n🔄 Please try your question again.";
    } else {
      errorDesign = "⚠️ 𝗦𝗲𝗿𝘃𝗶𝗰𝗲 𝗨𝗻𝗮𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲\n━━━━━━━━━━━━━━━━━━\n❌ Failed to reach AI API.\n🔧 Please try again later.\n📞 Contact admin if issue persists.\n━━━━━━━━━━━━━━━━━━\n✨ Still here to help!";
    }
    
    // Edit waiting message to show error
    return api.editMessage(errorDesign, waitingMessage.messageID);
  }
};
