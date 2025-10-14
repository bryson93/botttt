module.exports.config = {
    name: "usernoti",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    credits: "bryson",
    description: "Sends a notification to all group chats",
    commandCategory: "utility",
    usages: "[text]",
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const custom = args.join(' ');

    if (!custom) {
        return api.sendMessage("🚫 Please provide a message to send to all groups.", event.threadID);
    }

    try {
        const senderInfo = await api.getUserInfo(event.senderID);
        const senderName = senderInfo[event.senderID].name;
        
        const threadList = await api.getThreadList(25, null, ['INBOX']);
        let sentCount = 0;

        async function sendMessage(thread) {
            try {
                await api.sendMessage({
                    body: `📬 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 𝗙𝗥𝗢𝗠 𝗨𝗦𝗘𝗥\n\n👤 𝗙𝗿𝗼𝗺: ${senderName}\n💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${custom}\n📌 𝗙𝗿𝗼𝗺 𝗴𝗿𝗼𝘂𝗽: ${thread.name}\n\n━━━━━━━━━━━━━━━━━━\n📋 𝗧𝗵𝗶𝘀 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝘄𝗮𝘀 𝘀𝗲𝗻𝘁 𝘁𝗼 𝗮𝗹𝗹 𝗴𝗿𝗼𝘂𝗽𝘀`,
                    mentions: [{
                        tag: senderName,
                        id: event.senderID
                    }]
                }, thread.threadID);
                sentCount++;
            } catch (error) {
                console.error("Error sending message to thread:", error);
            }
        }

        for (const thread of threadList) {
            if (sentCount >= 20) {
                break;
            }
            if (thread.isGroup && thread.threadID != event.threadID) {
                await sendMessage(thread);
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Send summary to user
        api.sendMessage(`✅ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗦𝗘𝗡𝗧\n\n📤 𝗦𝗲𝗻𝘁 𝘁𝗼: ${sentCount} groups\n💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: "${custom}"\n\n━━━━━━━━━━━━━━━━━━\n⚠️ 𝗡𝗼𝘁𝗲: Your message has been broadcasted to all available groups.`, event.threadID);

    } catch (error) {
        console.error("Error in usernoti command:", error);
        api.sendMessage("❌ An error occurred while sending messages to groups.", event.threadID);
    }
};
