let config = {};
try {
    config = require("../config.json");
} catch (e) {
    config.botName = "❖━═ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ʙᴏᴛ ═━❖";
}

module.exports.config = {
    name: "nickname",
    version: "1.0.1",
    role: 0,
    description: "Automatically sets and maintains the bot's nickname in groups.",
    prefix: false,
    premium: false,
    credits: "bryson",
    cooldowns: 0,
    category: "system",
    handleEvent: true
};

module.exports.handleEvent = async function ({ api, event }) {
    try {
        const botID = api.getCurrentUserID();
        const botName = config.botName || "❖━═ ᴀᴜᴛᴏᴍᴀᴛᴇᴅ ʙᴏᴛ ═━❖";

        // When bot is added to group
        if (
            event.logMessageType === "log:subscribe" &&
            event.logMessageData &&
            Array.isArray(event.logMessageData.addedParticipants) &&
            event.logMessageData.addedParticipants.some(user => user.userFbId === botID)
        ) {
            setTimeout(() => {
                api.changeNickname(botName, event.threadID, botID, (err) => {
                    if (err) return console.error("❌ Failed to set nickname:", err);
                });
            }, 1000);
        }

        // When nickname is changed
        if (event.logMessageType === "log:thread-nickname-update" && 
            event.logMessageData.participant_id === botID) {
            
            setTimeout(() => {
                api.changeNickname(botName, event.threadID, botID, (err) => {
                    if (err) return console.error("❌ Failed to restore nickname:", err);
                    
                    // Send warning message
                    api.sendMessage(`⚠️ 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗘𝗗

My nickname has been restored to the default setting:
"${botName}"

Please do not change my nickname.`, event.threadID);
                });
            }, 1000);
        }
    } catch (error) {
        console.error("❌ Error in nickname event handler:", error);
    }
};
