const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports.config = {
    name: "shoti",
    version: "1.0.0",
    role: 0,
    description: "Fetch a random Shoti video.",
    prefix: false,
    premium: false,
    credits: "bryson",
    cooldowns: 10,
    category: "media"
};

module.exports.run = async function ({ api, event }) {
    try {
        api.sendMessage("⏳ Getting Shoti video...", event.threadID, event.messageID);

        const response = await axios.get('https://api.ccprojectsapis-jonell.gleeze.com/api/shoti', {
            timeout: 30000
        });

        const data = response.data;
        const videoUrl = data.url || data.videoUrl || data.content || data.result?.url || data.data?.url;

        if (!videoUrl) {
            return api.sendMessage('❌ No video found', event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp4`;
        const filePath = path.join(__dirname, fileName);

        const downloadResponse = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            timeout: 60000
        });

        const writer = fs.createWriteStream(filePath);
        downloadResponse.data.pipe(writer);

        writer.on('finish', async () => {
            api.sendMessage({
                body: '🎥 Shoti Video',
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error("Error:", e);
                }
            }, event.messageID);
        });

        writer.on('error', (error) => {
            console.error('Error:', error);
            api.sendMessage('❌ Download failed', event.threadID, event.messageID);
        });

    } catch (error) {
        console.error('Error:', error.message);
        api.sendMessage('❌ Failed to get video', event.threadID, event.messageID);
    }
};
