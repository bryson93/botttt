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
    credits: "Vern",
    cooldowns: 10,
    category: "media"
};

module.exports.run = async function ({ api, event }) {
    try {
        // Inform user about the fetching process
        api.sendMessage("🎬 𝗙𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗮 𝗿𝗮𝗻𝗱𝗼𝗺 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼, 𝗽𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁...", event.threadID, event.messageID);

        // API call to your working endpoint
        const response = await axios.get('https://api.ccprojectsapis-jonell.gleeze.com/api/shoti', {
            timeout: 30000
        });

        console.log('API Response received:', response.data);

        const data = response.data;
        
        // Use downloadUrl from the response
        if (!data || !data.downloadUrl) {
            console.log('No downloadUrl found in response:', data);
            return api.sendMessage('❌ 𝗡𝗼 𝘃𝗶𝗱𝗲𝗼 𝗳𝗼𝘂𝗻𝗱 𝗶𝗻 𝘁𝗵𝗲 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.', event.threadID, event.messageID);
        }

        const videoUrl = data.downloadUrl;
        const userName = data.username || 'Unknown';
        const description = data.description || 'No description';
        const region = data.region || 'Unknown';

        const fileName = `${event.messageID}.mp4`;
        const filePath = path.join(__dirname, fileName);

        console.log('Downloading video from:', videoUrl);
        
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
                body: `🎥 𝗛𝗲𝗿𝗲'𝘀 𝘆𝗼𝘂𝗿 𝗿𝗮𝗻𝗱𝗼𝗺 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼!\n👤 𝗨𝘀𝗲𝗿: ${userName}\n📝 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${description}\n🌍 𝗥𝗲𝗴𝗶𝗼𝗻: ${region}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                fs.unlinkSync(filePath); // Cleanup
            }, event.messageID);
        });

        writer.on('error', (error) => {
            console.error('Download error:', error);
            api.sendMessage('🚫 𝗘𝗿𝗿𝗼𝗿 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗶𝗻𝗴 𝘁𝗵𝗲 𝘃𝗶𝗱𝗲𝗼. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.', event.threadID, event.messageID);
        });

    } catch (error) {
        console.error('Error fetching Shoti video:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        api.sendMessage(`🚫 𝗘𝗿𝗿𝗼𝗿 𝗳𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼: ${error.message}`, event.threadID, event.messageID);
    }
};
