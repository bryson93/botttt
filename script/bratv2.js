const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "bratv2",
    version: "1.0.0",
    role: 0,
    description: "Create brat style images",
    hasPrefix: true,
    credits: "bryson",
    cooldowns: 10,
    category: "image",
    usages: "bratv2 [text]"
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    if (!args[0]) {
        return api.sendMessage("📝 Please enter text for brat image\nExample: bratv2 hello", threadID, messageID);
    }

    const text = args.join(" ");
    
    // Send waiting message
    const waitingMessage = await api.sendMessage("⏳ Creating brat image...", threadID);

    try {
        const apiUrl = `https://api.nekolabs.web.id/canvas/brat/v2?text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(apiUrl, {
            responseType: 'stream',
            timeout: 30000
        });

        // Delete waiting message
        api.unsendMessage(waitingMessage.messageID);

        const fileName = `bratv2_${Date.now()}.jpg`;
        const filePath = path.join(__dirname, fileName);

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `✅ BRAT V2 Image Created\nText: "${text}"`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Error deleting file:", e);
                }
            }, messageID);
        });

        writer.on('error', (error) => {
            console.error("Download error:", error);
            api.unsendMessage(waitingMessage.messageID);
            api.sendMessage("❌ Error creating image", threadID, messageID);
        });

    } catch (error) {
        console.error('BRAT V2 API Error:', error.message);
        
        api.unsendMessage(waitingMessage.messageID);
        api.sendMessage("❌ Failed to create image. Try again later.", threadID, messageID);
    }
};
