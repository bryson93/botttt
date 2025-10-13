module.exports.config = {
    name: "bye",
    version: "1.0.0",
    role: 2,
    credits: "Bryson",
    description: "Leave the bot in thread with message",
    aliases: ["leavebot", "exit"],
    cooldown: 0,
    hasPrefix: true,
    usage: "{p}bye [thread id]"
};

module.exports.run = async function({ api, event, args }) {
    try {
        const targetThreadID = args[0];
        
        if (!targetThreadID) {
            const threadInfo = await api.getThreadInfo(event.threadID);
            await api.sendMessage("👋 Goodbye everyone! Bot is leaving the group.", event.threadID);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
        } else {
            if (isNaN(targetThreadID)) {
                return api.sendMessage("❌ Please provide a valid thread ID.", event.threadID);
            }
            
            try {
                await api.sendMessage("👋 Goodbye everyone! Bot is leaving the group.", targetThreadID);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.log("Could not send message to target thread:", e);
            }
            
            await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadID);
            return api.sendMessage(`✅ Bot has left the thread: ${targetThreadID}`, event.threadID);
        }
    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ An error occurred while trying to leave the thread.", event.threadID);
    }
};
