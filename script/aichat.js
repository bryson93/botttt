const axios = require('axios');

module.exports.config = {
    name: "aireply",
    version: "1.0.0",
    hasPermission: 0,
    credits: "bryson",
    description: "Auto AI reply using NekoLabs API",
    commandCategory: "ai",
    usages: "[on/off]",
    cooldowns: 0,
    hasPrefix: false
};

module.exports.onLoad = function() {
    const { writeFileSync, existsSync } = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, "aireply.json");

    if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify({ aireply: false }));
    }
};

module.exports.handleEvent = async function({ api, event }) {
    const { readFileSync, writeFileSync } = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, "aireply.json");
    
    const data = JSON.parse(readFileSync(filePath));
    
    // Check if auto-reply is enabled
    if (!data.aireply) return;
    
    // Don't reply to bot's own messages
    if (event.senderID === api.getCurrentUserID()) return;
    
    // Don't reply to system messages
    if (event.type !== "message") return;
    
    const message = event.body;
    if (!message) return;
    
    // Ignore commands (messages starting with prefix)
    if (message.startsWith('/') || message.startsWith('!') || message.startsWith('.')) return;
    
    try {
        // Show typing indicator
        api.setMessageReaction("⏳", event.messageID, () => {}, true);
        
        const response = await axios.get(`https://api.nekolabs.web.id/ai/ai4chat?query=${encodeURIComponent(message)}`);
        
        if (response.data && response.data.response) {
            // Remove typing indicator
            api.setMessageReaction("", event.messageID, () => {}, true);
            
            // Send AI response
            api.sendMessage(response.data.response, event.threadID, event.messageID);
        } else {
            throw new Error('Invalid API response');
        }
        
    } catch (error) {
        console.error('AI Reply Error:', error);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
};

module.exports.run = async function({ api, event, args }) {
    const { readFileSync, writeFileSync } = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, "aireply.json");
    
    const data = JSON.parse(readFileSync(filePath));
    
    if (args[0] === 'on') {
        data.aireply = true;
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        api.sendMessage("✅ Auto AI Reply has been ENABLED\n\nI will now automatically reply to messages in this chat.", event.threadID, event.messageID);
        
    } else if (args[0] === 'off') {
        data.aireply = false;
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        api.sendMessage("❌ Auto AI Reply has been DISABLED\n\nI will no longer automatically reply to messages.", event.threadID, event.messageID);
        
    } else {
        const status = data.aireply ? "🟢 ENABLED" : "🔴 DISABLED";
        api.sendMessage(`🤖 Auto AI Reply Status: ${status}\n\nUsage:\n• aireply on - Enable auto-reply\n• aireply off - Disable auto-reply`, event.threadID, event.messageID);
    }
};
