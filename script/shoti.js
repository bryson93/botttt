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
        // Inform user about the fetching process
        api.sendMessage("🎬 Fetching a random Shoti video, please wait...", event.threadID, event.messageID);

        // Corrected API call - removed double slash
        const response = await axios.get('https://api.ccprojectsapis-jonell.gleeze.com/api/shoti', {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = response.data;
        
        // Check different possible response structures
        const videoData = data.data || data.result || data;
        
        if (!videoData || !videoData.videoUrl) {
            console.log("API Response:", JSON.stringify(data, null, 2));
            return api.sendMessage('❌ Failed to fetch a Shoti video. Please try again later.', event.threadID, event.messageID);
        }

        const videoUrl = videoData.videoUrl || videoData.url || videoData.content;
        const username = videoData.username || videoData.user || "Unknown User";
        const nickname = videoData.nickname || videoData.name || "Unknown";

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
                body: `🎥 Random Shoti Video\n\n👤 User: ${username}\n📛 Nickname: ${nickname}\n\n✨ Enjoy the video!`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                try {
                    fs.unlinkSync(filePath); // Cleanup
                } catch (e) {
                    console.error("Error deleting file:", e);
                }
            }, event.messageID);
        });

        writer.on('error', (error) => {
            console.error("Download error:", error);
            api.sendMessage('🚫 Error downloading the video. Please try again.', event.threadID, event.messageID);
        });

    } catch (error) {
        console.error('Error fetching Shoti video:', error.response?.data || error.message);
        
        let errorMessage = '🚫 Error fetching Shoti video. ';
        
        if (error.code === 'ECONNREFUSED') {
            errorMessage += 'API server is down.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage += 'Request timed out.';
        } else if (error.response?.status === 404) {
            errorMessage += 'API endpoint not found.';
        } else {
            errorMessage += 'Please try again later.';
        }
        
        api.sendMessage(errorMessage, event.threadID, event.messageID);
    }
};
