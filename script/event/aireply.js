const axios = require('axios');

module.exports.config = {
    name: "autoreply",
    version: "1.0.0", 
    hasPermission: 0,
    credits: "Deku & NekoLabs",
    description: "Auto AI Reply - Always On",
    commandCategory: "ai",
    usages: "",
    cooldowns: 1,
    hasPrefix: false
};

// Simple cooldown system
const userLastRequest = new Map();

module.exports.handleEvent = async function({ api, event }) {
    // Ignore bot's own messages
    if (event.senderID === api.getCurrentUserID()) return;
    
    // Only process regular messages
    if (event.type !== "message") return;
    
    const message = event.body?.trim();
    if (!message || message.length < 2) return;
    
    // Ignore commands and URLs
    if (message.startsWith('/') || message.startsWith('!') || message.startsWith('.') || 
        message.includes('http') || message.includes('.com')) return;
    
    // Cooldown check (2 seconds)
    const now = Date.now();
    if (userLastRequest.get(event.senderID) && (now - userLastRequest.get(event.senderID)) < 2000) return;
    
    try {
        // Show typing indicator
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        
        const response = await axios.get(`https://api.nekolabs.web.id/ai/ai4chat?query=${encodeURIComponent(message)}`);
        
        if (response.data && response.data.response) {
            // Update cooldown
            userLastRequest.set(event.senderID, now);
            
            // Remove typing indicator and send response
            api.setMessageReaction("", event.messageID, () => {}, true);
            api.sendMessage(response.data.response, event.threadID, event.messageID);
        }
        
    } catch (error) {
        console.error('Auto-Reply Error:', error);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
};

// Empty run function - bot only works through events
module.exports.run = async function({ api, event }) {
    api.sendMessage("🤖 AI Auto-Reply is ALWAYS ENABLED\n\nI automatically respond to any message in this chat!", event.threadID, event.messageID);
};
