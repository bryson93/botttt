const axios = require('axios');

module.exports.config = {
    name: "aireply",
    version: "1.0.0",
    hasPermission: 0,
    credits: "Deku & NekoLabs",
    description: "Auto AI reply - Always Enabled",
    commandCategory: "ai",
    usages: "[message]",
    cooldowns: 1,
    hasPrefix: false
};

// Store to avoid spam/reply loops
const userCooldown = new Map();
const botReplies = new Set();

module.exports.handleEvent = async function({ api, event }) {
    // Don't reply to bot's own messages
    if (event.senderID === api.getCurrentUserID()) return;
    
    // Don't reply to system messages
    if (event.type !== "message") return;
    
    const message = event.body?.trim();
    if (!message || message.length < 2) return;
    
    // Ignore commands
    if (message.startsWith('/') || message.startsWith('!') || message.startsWith('.') || message.startsWith('~')) return;
    
    // Ignore URLs
    if (message.includes('http') || message.includes('.com') || message.includes('www.')) return;
    
    // Cooldown check (3 seconds per user)
    const now = Date.now();
    const lastRequest = userCooldown.get(event.senderID) || 0;
    if (now - lastRequest < 3000) return;
    
    // Don't reply to very short messages (except questions)
    if (message.length < 3 && !message.endsWith('?')) return;
    
    try {
        // Show typing indicator
        api.setMessageReaction("💭", event.messageID, () => {}, true);
        
        const response = await axios.get(`https://api.nekolabs.web.id/ai/ai4chat?query=${encodeURIComponent(message)}`);
        
        if (response.data && response.data.response) {
            // Remove typing indicator
            api.setMessageReaction("", event.messageID, () => {}, true);
            
            // Update cooldown
            userCooldown.set(event.senderID, now);
            
            // Send AI response
            const sentMessage = await api.sendMessage(response.data.response, event.threadID, event.messageID);
            
            // Track bot replies to avoid loops
            if (sentMessage && sentMessage.messageID) {
                botReplies.add(sentMessage.messageID);
                // Clean up old entries
                if (botReplies.size > 100) {
                    const first = botReplies.values().next().value;
                    botReplies.delete(first);
                }
            }
            
        } else {
            throw new Error('Invalid API response');
        }
        
    } catch (error) {
        console.error('AI Reply Error:', error);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
};

// Optional: Command to chat directly with AI
module.exports.run = async function({ api, event, args }) {
    const message = args.join(" ").trim();
    
    if (!message) {
        return api.sendMessage("🤖 AI Auto-Reply is ALWAYS ACTIVE\n\nI automatically respond to messages in this chat!\n\nJust type anything and I'll reply instantly.", event.threadID, event.messageID);
    }
    
    try {
        api.setMessageReaction("💭", event.messageID, () => {}, true);
        
        const response = await axios.get(`https://api.nekolabs.web.id/ai/ai4chat?query=${encodeURIComponent(message)}`);
        
        if (response.data && response.data.response) {
            api.setMessageReaction("", event.messageID, () => {}, true);
            api.sendMessage(response.data.response, event.threadID, event.messageID);
        }
        
    } catch (error) {
        console.error('AI Command Error:', error);
        api.sendMessage("❌ Sorry, I encountered an error. Please try again.", event.threadID, event.messageID);
    }
};
