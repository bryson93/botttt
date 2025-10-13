module.exports.config = {
    name: "sendnoti",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "Vern",
    description: "Sends a message to all groups and can only be done by the admin.",
    usePrefix: true,
    commandCategory: "noti",
    usages: "[Text]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const allowedUID = ['61578130127315']; 

    if (!allowedUID.includes(event.senderID)) {
        return api.sendMessage("› You are not authorized to use this command.", event.threadID);
    }

    const threadList = await api.getThreadList(25, null, ['INBOX']);
    let sentCount = 0;
    const custom = args.join(' ');

    if (!custom) {
        return api.sendMessage("› Please provide a message to send.", event.threadID);
    }

    async function sendMessage(thread) {
        try {
            await api.sendMessage(`✦━─━─━─━─◈─━─━─━─━✦
   ⚜ NOTICE FROM DEV ⚜
✦━─━─━─━─◈─━─━─━─━✦

⌗ Developer: BRYSON

『𝗡𝗼𝘁𝗶𝗰𝗲』 ➺ ${custom}`, thread.threadID);
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
        api.sendMessage(`› Sent the notification successfully to ${sentCount} groups.`, event.threadID);
    } else {
        api.sendMessage("› No eligible group threads found to send the message to.", event.threadID);
    }
};
