const axios = require("axios");

module.exports.config = {
  name: "gemini",
  version: "1.0.0",
  hasPermission: 0,
  credits: "bryson",
  description: "Ask the Gemini AI a question and get a thoughtful answer.",
  commandCategory: "ai",
  usages: "gemini [question]",
  cooldowns: 5,
  role: 0,
  hasPrefix: false
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ");

  if (!prompt) {
    return api.sendMessage(
      "🔮 𝗚𝗘𝗠𝗜𝗡𝗜 𝗔𝗜\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n📝 𝗣𝗹𝗲𝗮𝘀𝗲 𝗲𝗻𝘁𝗲𝗿 𝘆𝗼𝘂𝗿 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻\n\n💫 𝗘𝘅𝗮𝗺𝗽𝗹𝗲𝘀:\ngemini Explain quantum computing\ngemini How does AI work?\ngemini Write a poem about nature\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n⚡ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗚𝗼𝗼𝗴𝗹𝗲 𝗚𝗲𝗺𝗶𝗻𝗶",
      threadID,
      messageID
    );
  }

  // Send waiting message with design
  const waitingMessage = await api.sendMessage(
    "⏳ 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚...\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n🌀 𝗔𝗻𝗮𝗹𝘆𝘇𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻...\n💭 𝗔𝗰𝗰𝗲𝘀𝘀𝗶𝗻𝗴 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗜...\n✨ 𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗶𝗻𝗴 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲...\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n🕒 𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁 𝗮 𝗺𝗼𝗺𝗲𝗻𝘁",
    threadID
  );

  try {
    const apiUrl = `https://arychauhann.onrender.com/api/gemini-proxy2?prompt=${encodeURIComponent(prompt)}`;
    
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
        console.error("[gemi.js] JSON Parse Error:", parseError);
      }
    }

    // Extract the actual response text
    const answer = responseData?.response || responseData?.answer || responseData?.data || responseData?.message || responseData?.result || responseData;

    if (!answer || answer.trim() === "") {
      // Edit waiting message to show error
      return api.editMessage(
        "⚠️ 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 𝗨𝗡𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n🔧 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗜 𝗶𝘀 𝘁𝗲𝗺𝗽𝗼𝗿𝗮𝗿𝗶𝗹𝘆 𝘂𝗻𝗮𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲\n\n🔄 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗶𝗻 𝗮 𝗳𝗲𝘄 𝗺𝗶𝗻𝘂𝘁𝗲𝘀\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n💫 𝗪𝗲'𝗹𝗹 𝗯𝗲 𝗯𝗮𝗰𝗸 𝘀𝗼𝗼𝗻",
        waitingMessage.messageID
      );
    }

    // Create beautiful response design
    const createResponseBox = (text, isFirst = true) => {
      const header = isFirst ? 
        "🤖 𝗚𝗘𝗠𝗜𝗡𝗜 𝗥𝗘𝗦𝗣𝗢𝗡𝗦𝗘\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n" : 
        "↳ 𝗖𝗢𝗡𝗧𝗜𝗡𝗨𝗘𝗗\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n";
      
      const footer = isFirst ? 
        "\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n🌟 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗚𝗼𝗼𝗴𝗹𝗲 𝗚𝗲𝗺𝗶𝗻𝗶" : 
        "\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰";
      
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
    console.error("[gemi.js] API Error:", err.message);
    
    let errorDesign = "";
    
    if (err.code === 'ECONNREFUSED') {
      errorDesign = "🌐 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗜𝗢𝗡 𝗙𝗔𝗜𝗟𝗘𝗗\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n🚫 𝗖𝗮𝗻𝗻𝗼𝘁 𝗰𝗼𝗻𝗻𝗲𝗰𝘁 𝘁𝗼 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗜\n\n📡 𝗣𝗹𝗲𝗮𝘀𝗲 𝗰𝗵𝗲𝗰𝗸 𝘆𝗼𝘂𝗿 𝗶𝗻𝘁𝗲𝗿𝗻𝗲𝘁 𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n🔄 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝘀𝗼𝗼𝗻";
    } else if (err.code === 'ETIMEDOUT') {
      errorDesign = "⏰ 𝗧𝗜𝗠𝗘𝗢𝗨𝗧 𝗘𝗥𝗥𝗢𝗥\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n⏳ 𝗥𝗲𝗾𝘂𝗲𝘀𝘁 𝘁𝗼𝗼𝗸 𝘁𝗼𝗼 𝗹𝗼𝗻𝗴\n\n💡 𝗧𝗿𝘆 𝘀𝗶𝗺𝗽𝗹𝗶𝗳𝘆𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗾𝘂𝗲𝘀𝘁𝗶𝗼𝗻\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n⚡ 𝗥𝗲𝘁𝗿𝘆 𝗶𝗻 𝟯𝟬 𝘀𝗲𝗰𝗼𝗻𝗱𝘀";
    } else {
      errorDesign = "🚫 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 𝗘𝗥𝗥𝗢𝗥\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n❌ 𝗧𝗲𝗺𝗽𝗼𝗿𝗮𝗿𝘆 𝘀𝗲𝗿𝘃𝗶𝗰𝗲 𝗶𝘀𝘀𝘂𝗲\n\n🛠️ 𝗠𝗮𝗶𝗻𝘁𝗲𝗻𝗮𝗻𝗰𝗲 𝗶𝗻 𝗽𝗿𝗼𝗴𝗿𝗲𝘀𝘀\n\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n✨ 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂 𝗳𝗼𝗿 𝘆𝗼𝘂𝗿 𝗽𝗮𝘁𝗶𝗲𝗻𝗰𝗲";
    }
    
    // Edit waiting message to show error
    return api.editMessage(errorDesign, waitingMessage.messageID);
  }
};
