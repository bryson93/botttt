module.exports.config = {
    name: "usernoti",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    credits: "bryson",
    description: "Sends a message to all group members (all users can use)",
    commandCategory: "utility",
    usages: "[text]",
    cooldowns: 20
};

module.exports.run = async ({ api, event, args }) => {
    const custom = args.join(' ');

    if (!custom) {
        return api.sendMessage("🚫 Please provide a message to send to group members.", event.threadID);
    }

    if (!event.isGroup) {
        return api.sendMessage("❌ This command can only be used in group chats.", event.threadID);
    }

    try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs;
        
        const senderInfo = await api.getUserInfo(event.senderID);
        const senderName = senderInfo[event.senderID].name;
        
        let sentCount = 0;
        let failedCount = 0;

        for (const userID of participants) {
            try {
                if (userID === api.getCurrentUserID() || userID === event.senderID) {
                    continue;
                }

                await api.sendMessage({
                    body: `📬 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 𝗙𝗥𝗢𝗠 𝗚𝗥𝗢𝗨𝗣

👤 From: ${senderName}
💬 Message: ${custom}

━━━━━━━━━━━━━━━━━━
📋 This message was sent from group: ${threadInfo.threadName}
💡 Reply to this message to respond to ${senderName}.`,
                    mentions: [{
                        tag: senderName,
                        id: event.senderID
                    }]
                }, userID);
                
                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Failed to send message to ${userID}:`, error);
                failedCount++;
            }
        }

        api.sendMessage(`✅ 𝗠𝗘𝗦𝗦𝗔𝗚𝗘 𝗦𝗘𝗡𝗧 𝗧𝗢 𝗠𝗘𝗠𝗕𝗘𝗥𝗦

📤 Successfully sent to: ${sentCount} members
❌ Failed to send: ${failedCount} members
💬 Your message: "${custom}"

━━━━━━━━━━━━━━━━━━
⚠️ Note: Members can reply to your message directly.`, event.threadID);

    } catch (error) {
        console.error("Error in usernoti command:", error);
        api.sendMessage("❌ An error occurred while sending messages to group members.", event.threadID);
    }
};

// Add this to handle replies to usernoti messages
module.exports.handleReply = async function ({ api, event, handleReply }) {
    if (handleReply && handleReply.type === "usernoti_reply") {
        try {
            // Forward the reply back to original sender
            await api.sendMessage({
                body: `📩 𝗥𝗘𝗣𝗟𝗬 𝗙𝗥𝗢𝗠 ${event.senderID}\n💬 Message: ${event.body}\n\n💡 This is a reply to your usernoti message.`,
            }, handleReply.senderID);
            
            // Confirm to the replier
            await api.sendMessage("✅ Your reply has been sent to the original sender.", event.threadID);
        } catch (error) {
            console.error("Error handling usernoti reply:", error);
            await api.sendMessage("❌ Failed to send your reply.", event.threadID);
        }
    }
};
