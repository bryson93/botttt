module.exports.config = {
    name: "usernoti",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    credits: "bryson",
    description: "Sends a notification message from user to the group",
    commandCategory: "utility",
    usages: "[text]",
    cooldowns: 20
};

module.exports.run = async ({ api, event, args }) => {
    const custom = args.join(' ');

    if (!custom) {
        return api.sendMessage("🚫 Please provide a message to send.", event.threadID);
    }

    if (!event.isGroup) {
        return api.sendMessage("❌ This command can only be used in group chats.", event.threadID);
    }

    try {
        const senderInfo = await api.getUserInfo(event.senderID);
        const senderName = senderInfo[event.senderID].name;
        const threadInfo = await api.getThreadInfo(event.threadID);
        const groupName = threadInfo.threadName;

        // Send notification message with bold font
        api.sendMessage({
            body: `📬 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 𝗙𝗥𝗢𝗠 𝗨𝗦𝗘𝗥\n\n👤 𝗙𝗿𝗼𝗺: ${senderName}\n💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${custom}\n\n━━━━━━━━━━━━━━━━━━\n📋 𝗧𝗵𝗶𝘀 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝘄𝗮𝘀 𝘀𝗲𝗻𝘁 𝗳𝗿𝗼𝗺 𝗴𝗿𝗼𝘂𝗽: ${groupName}`,
            mentions: [{
                tag: senderName,
                id: event.senderID
            }]
        }, event.threadID);

    } catch (error) {
        console.error("Error in usernoti command:", error);
        api.sendMessage("❌ An error occurred while sending the message.", event.threadID);
    }
};
