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

        // API call to the new endpoint
        const response = await axios.get('https://api.ccprojectsapis-jonell.gleeze.com/api/shoti', {
            timeout: 30000
        });
        
        console.log('API Response:', response.data); // Debug log

        const data = response.data;
        
        // Check different possible response structures
        let videoUrl = data.url || data.video || data.content || data.data?.url || data.data?.video;
        
        if (!videoUrl) {
            console.log('No video URL found in response:', data);
            return api.sendMessage('❌ 𝗡𝗼 𝘃𝗶𝗱𝗲𝗼 𝗳𝗼𝘂𝗻𝗱 𝗶𝗻 𝘁𝗵𝗲 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.', event.threadID, event.messageID);
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
                body: `🎥 𝗛𝗲𝗿𝗲'𝘀 𝘆𝗼𝘂𝗿 𝗿𝗮𝗻𝗱𝗼𝗺 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼!`,
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
        api.sendMessage('🚫 𝗘𝗿𝗿𝗼𝗿 𝗳𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼. 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.', event.threadID, event.messageID);
    }
};
