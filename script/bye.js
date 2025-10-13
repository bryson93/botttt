module.exports.config = {
    name: "bye",
    version: "1.0.0",
    role: 2,
    hasPrefix: true,
    credits: "bryson",
    description: "Bot leaves thread with goodbye message",
    commandCategory: "system",
    usages: "{p}bye [threadID]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const threadID = args[0];

    if (!threadID) {
        return api.sendMessage("Please provide a thread ID.", event.threadID);
    }

    try {
        // Send goodbye message first
        await api.sendMessage("Bot is leaving this group. Goodbye! 👋", threadID);
        
        // Bot leaves the group
        await api.sendMessage("Goodbye everyone! 👋", threadID);
        await api.leaveGroup(threadID);
        
        // Send confirmation to admin
        api.sendMessage(`Bot successfully left thread: ${threadID}`, event.threadID);

    } catch (error) {
        api.sendMessage(`Error leaving thread: ${error.message}`, event.threadID);
    }
};
