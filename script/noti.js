module.exports.config = {
    name: "noti",
    version: "1.0.0",
    role: 2,
    hasPrefix: true,
    credits: "bryson",
    description: "Sends a message to all groups (admin only)",
    commandCategory: "system",
    usages: "[text]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const threadList = await api.getThreadList(25, null, ['INBOX']);
    let sentCount = 0;
    const custom = args.join(' ');

    if (!custom) {
        return api.sendMessage("🚫 Please provide a message to send.", event.threadID);
    }

    async function sendMessage(thread) {
        try {
            await api.sendMessage(`🔔 𝗔𝗗𝗠𝗜𝗡 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡

📢 𝗠𝗲𝘀𝘀𝗮𝗴𝗲: ${custom}

━━━━━━━━━━━━━━━━━━
⚠️ This is an automated notification from the system admin.`, thread.threadID);
            sentCount++;
        } catch (error) {
            console.error("Error sending a message:", error);
        }
    }

    for (const thread of threadList) {
        if (sentCount >= 20) {
            break;
        }
        if (thread.isGroup && thread.name != thread.threadID && thread.threadID != event.threadID) {
            await sendMessage(thread);
        }
    }

    if (sentCount > 0) {
        api.sendMessage(`✅ 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗦𝗘𝗡𝗧

📤 Sent to: ${sentCount} groups
💬 Message: "${custom}"`, event.threadID);
    } else {
        api.sendMessage("❌ No eligible group threads found to send the message to.", event.threadID);
    }
};
