const axios = require("axios");

module.exports.config = {
  name: "dsv2",
  version: "1.0.0",
  hasPermission: 0,
  credits: "bryson",
  description: "Ask DeepSeek AI a question and get a response.",
  commandCategory: "ai",
  usages: "deepseek [question]",
  cooldowns: 5,
  role: 0,
  hasPrefix: false
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage(
      "🔷 𝗗𝗘𝗘𝗣𝗦𝗘𝗘𝗞\n═══════════════════\n\n📩 𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝘆𝗼𝘂𝗿 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻\n\n𝗨𝘀𝗮𝗴𝗲:\nds What is machine learning?\nds Write python code\nds Explain AI concepts\n\n═══════════════════\n🧠 𝗔𝗱𝘃𝗮𝗻𝗰𝗲𝗱 𝗔𝗜 𝗠𝗼𝗱𝗲𝗹",
      threadID,
      messageID
    );
  }

  // Send waiting message with design
  const waitingMessage = await api.sendMessage(
    "⏳ 𝗣𝗿𝗼𝗰𝗲𝘀𝘀𝗶𝗻𝗴...\n═══════════════════\n\n🤔 𝗔𝗻𝗮𝗹𝘆𝘇𝗶𝗻𝗴 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻\n🔍 𝗦𝗲𝗮𝗿𝗰𝗵𝗶𝗻𝗴 𝗸𝗻𝗼𝘄𝗹𝗲𝗱𝗴𝗲 𝗯𝗮𝘀𝗲\n💡 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲\n\n═══════════════════\n🔄 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁",
    threadID
  );

  try {
    const apiUrl = `https://arychauhann.onrender.com/api/deepseek2?prompt=${encodeURIComponent(prompt)}&model=`;
    
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
        console.error("[deepseekv2.js] JSON Parse Error:", parseError);
      }
    }

    // Extract the actual response text
    const answer = responseData?.response || responseData?.answer || responseData?.data || responseData?.message || responseData?.result || responseData;

    if (!answer || answer.trim() === "") {
      // Delete waiting message and send error
      api.unsendMessage(waitingMessage.messageID);
      return api.sendMessage(
        "❌ 𝗘𝗿𝗿𝗼𝗿\n═══════════════════\n\n🚫 𝗡𝗼 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗿𝗲𝗰𝗲𝗶𝘃𝗲𝗱\n🔧 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿\n\n═══════════════════\n💫 𝗦𝗲𝗿𝘃𝗶𝗰𝗲 𝘄𝗶𝗹𝗹 𝗿𝗲𝘀𝘂𝗺𝗲 𝘀𝗼𝗼𝗻",
        threadID,
        messageID
      );
    }

    // Delete the waiting message
    api.unsendMessage(waitingMessage.messageID);

    // Create new DeepSeek response design
    const createResponseBox = (text, isFirst = true) => {
      const header = isFirst ? 
        "🧠 𝗗𝗘𝗘𝗣𝗦𝗘𝗘𝗞 𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗦\n═══════════════════\n\n" : 
        "↪️ 𝗖𝗼𝗻𝘁𝗶𝗻𝘂𝗲𝗱\n═══════════════════\n\n";
      
      const footer = isFirst ? 
        "\n\n═══════════════════\n🔷 𝗗𝗲𝗲𝗽𝗦𝗲𝗲𝗸 𝗩𝟮 | 𝗯𝗿𝘆𝘀𝗼𝗻" : 
        "\n\n═══════════════════";
      
      return `${header}${text}${footer}`;
    };

    // Split long messages if they exceed Facebook's limit (~2000 characters)
    const messageParts = [];
    const maxLength = 1800;
    
    if (answer.length > maxLength) {
      for (let i = 0; i < answer.length; i += maxLength) {
        const chunk = answer.substring(i, i + maxLength);
        messageParts.push(createResponseBox(chunk, i === 0));
      }
    } else {
      messageParts.push(createResponseBox(answer, true));
    }

    // Send all message parts
    for (const part of messageParts) {
      await api.sendMessage(part, threadID);
    }

  } catch (err) {
    console.error("[deepseekv2.js] API Error:", err.message);
    
    // Delete waiting message and send error
    api.unsendMessage(waitingMessage.messageID);
    
    let errorDesign = "";
    
    if (err.code === 'ECONNREFUSED') {
      errorDesign = "🌐 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻 𝗙𝗮𝗶𝗹𝗲𝗱\n═══════════════════\n\n📡 𝗖𝗮𝗻'𝘁 𝗿𝗲𝗮𝗰𝗵 𝗗𝗲𝗲𝗽𝗦𝗲𝗲𝗸\n🔄 𝗖𝗵𝗲𝗰𝗸 𝗶𝗻𝘁𝗲𝗿𝗻𝗲𝘁 𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻\n\n═══════════════════\n⚡ 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝘀𝗼𝗼𝗻";
    } else if (err.code === 'ETIMEDOUT') {
      errorDesign = "⏰ 𝗧𝗶𝗺𝗲𝗼𝘂𝘁\n═══════════════════\n\n⏳ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝘁𝗼𝗼𝗸 𝘁𝗼𝗼 𝗹𝗼𝗻𝗴\n💭 𝗧𝗿𝘆 𝘀𝗵𝗼𝗿𝘁𝗲𝗿 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻\n\n═══════════════════\n🔄 𝗥𝗲𝘁𝗿𝘆 𝗶𝗻 𝟯𝟬𝘀";
    } else {
      errorDesign = "⚠️ 𝗦𝗲𝗿𝘃𝗶𝗰𝗲 𝗗𝗼𝘄𝗻\n═══════════════════\n\n🔧 𝗗𝗲𝗲𝗽𝗦𝗲𝗲𝗸 𝘁𝗲𝗺𝗽𝗼𝗿𝗮𝗿𝗶𝗹𝘆 𝘂𝗻𝗮𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲\n🔄 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗶𝗻 𝗳𝗲𝘄 𝗺𝗶𝗻𝘂𝘁𝗲𝘀\n\n═══════════════════\n💫 𝗕𝗮𝗰𝗸 𝘀𝗼𝗼𝗻";
    }
    
    return api.sendMessage(errorDesign, threadID, messageID);
  }
};
