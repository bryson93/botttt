const axios = require('axios');

module.exports.config = {
    name: "aireply",
    version: "1.0.0",
};

module.exports.handleEvent = async function ({ api, event }) {
    // Ignore if the message is from the bot itself or is a system event
    if (event.senderID === api.getCurrentUserID() || event.type !== "message") {
        return;
    }

    const message = event.body?.trim();
    
    // Only respond to messages that are not empty and not commands
    if (message && !message.startsWith('!') && !message.startsWith('/')) {
        try {
            const response = await axios.get('https://api.nekolabs.web.id/ai/ai4chat', {
                params: {
                    message: message
                }
            });

            let aiReply = response.data?.response || response.data?.message;
            
            if (aiReply) {
                // Send the AI response
                api.sendMessage(aiReply, event.threadID, event.messageID);
            }
        } catch (error) {
            console.error("Error calling AI API:", error);
            // Optional: Send error message
            // api.sendMessage("Sorry, I'm having trouble responding right now.", event.threadID, event.messageID);
        }
    }
};

module.exports.run = async function ({ api, event }) {
    api.sendMessage("🤖 AI Auto-Reply is now active! I'll automatically respond to messages in this chat.", event.threadID, event.messageID);
};
