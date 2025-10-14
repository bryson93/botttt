let config = {};
try {
    config = require("../config.json");
} catch (e) {
    config.botName = "❖━═ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ʙᴏᴛ ═━❖";
}

module.exports.config = {
    name: "antiChangeNickname",
    version: "1.0.0",
    role: 0,
    description: "Automatically reverts any changes to the bot's nickname in group chats.",
    prefix: false,
    premium: false,
    credits: "Vern",
    cooldowns: 0,
    category: "system",
    handleEvent: true
};

module.exports.handleEvent = async function ({ api, event }) {
    try {
        if (event.logMessageType === "log:thread-nickname" && 
            event.logMessageData && 
            event.logMessageData.participant_id === api.getCurrentUserID()) {
            
            const botID = api.getCurrentUserID();
            const botName = config.botName || "❖━═ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ʙᴏᴛ ═━❖";
            const threadInfo = await api.getThreadInfo(event.threadID);
            const currentNickname = threadInfo.nicknames ? threadInfo.nicknames[botID] : null;
            
            // If nickname was changed and doesn't match the configured bot name, revert it
            if (currentNickname && currentNickname.nickname !== botName) {
                setTimeout(() => {
                    api.changeNickname(botName, event.threadID, botID, (err) => {
                        if (err) {
                            console.error("❌ Failed to revert nickname:", err);
                        } else {
                            console.log(`✅ Successfully reverted nickname to '${botName}' in thread ${event.threadID}`);
                        }
                    });
                }, 1000);
            }
        }
    } catch (error) {
        console.error("❌ Error in antiChangeNickname event handler:", error);
    }
};
