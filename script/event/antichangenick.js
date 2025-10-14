module.exports.config = {
    name: "antichangenick",
    version: "1.0.0",
    role: 1,
    description: "Prevents users from changing the bot's nickname in the thread",
    prefix: false,
    premium: false,
    credits: "Bryson",
    cooldowns: 0,
    category: "system",
    handleEvent: true
};

module.exports.handleEvent = async function ({ api, event }) {
    try {
        if (event.logMessageType === "log:thread-nickname-update") {
            const botID = api.getCurrentUserID();
            const { participant_id, nickname } = event.logMessageData;
            
            if (participant_id === botID) {
                const botName = global.config?.botName || "❖━═ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ʙᴏᴛ ═━❖";
                
                setTimeout(() => {
                    api.changeNickname(botName, event.threadID, botID, (err) => {
                        if (err) {
                            console.error("Failed to restore bot nickname:", err);
                            return;
                        }
                        
                        api.getUserInfo(participant_id, (err, userInfo) => {
                            if (!err && userInfo[participant_id]) {
                                const userName = userInfo[participant_id].name;
                                api.sendMessage({
                                    body: `⚠️ ${userName}, please do not change my nickname. My official name has been restored.`
                                }, event.threadID);
                            }
                        });
                    });
                }, 1000);
            }
        }
    } catch (error) {
        console.error("Error in anti change nickname handler:", error);
    }
};

module.exports.run = async function ({ api, event }) {
    api.sendMessage({
        body: "🤖 Anti-change nickname is active! I will automatically restore my nickname if anyone tries to change it."
    }, event.threadID);
};
