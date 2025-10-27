const axios = require('axios');

module.exports.config = {
    name: "autoreply",
    version: "1.0.0",
    role: 0,
    description: "Auto-reply AI for all messages",
    credits: "Developer",
    hasPrefix: false,
    cooldowns: 1
};

module.exports.handleEvent = async function({ api, event }) {
    // Skip if message is empty or from bot itself
    if (!event.body || event.senderID === api.getCurrentUserID()) return;
    
    try {
        const response = await axios.get(`https://api.nekolabs.web.id/ai/ai4chat?query=${encodeURIComponent(event.body)}`);
        
        if (response.data && response.data.result) {
            api.sendMessage(response.data.result, event.threadID, event.messageID);
        }
    } catch (error) {
        console.error("AI API Error:", error);
        // Optional: Send error message
        // api.sendMessage("❌ AI is temporarily unavailable.", event.threadID, event.messageID);
    }
};

module.exports.run = async function({ api, event }) {
    api.sendMessage("🤖 Auto-reply AI is active! I'll respond to all messages automatically.", event.threadID);
};
