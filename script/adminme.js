module.exports.config = {
    name: "adminme",
    version: "1.0.0",
    role: 2,
    hasPrefix: true,
    credits: "bryson",
    description: "Make the bot set you as group administrator",
    commandCategory: "group",
    usages: "adminme",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const allowedUID = ['61578130127315'];
    
    if (!allowedUID.includes(event.senderID)) {
        return api.sendMessage("❌ You are not authorized to use this command.", event.threadID, event.messageID);
    }
    
    try {
        const botID = api.getCurrentUserID();
        const userID = event.senderID;
        const threadID = event.threadID;
        
        // Check if the command is used in a group
        if (!event.isGroup) {
            return api.sendMessage(
                "❌ This command can only be used in group chats.",
                threadID,
                event.messageID
            );
        }
        
        // Get thread info to check bot's admin status
        const threadInfo = await api.getThreadInfo(threadID);
        const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
        
        if (!botIsAdmin) {
            return api.sendMessage(
                "❌ I need to be an administrator in this group to set you as admin.",
                threadID,
                event.messageID
            );
        }
        
        // Check if user is already admin
        const userIsAdmin = threadInfo.adminIDs.some(admin => admin.id === userID);
        
        if (userIsAdmin) {
            return api.sendMessage(
                "✅ You are already an administrator in this group.",
                threadID,
                event.messageID
            );
        }
        
        // Try to make user admin
        await api.changeAdminStatus(threadID, userID, true);
        
        // Send success message
        return api.sendMessage(
            "✅ Success! I've set you as group administrator.",
            threadID,
            event.messageID
        );
        
    } catch (error) {
        console.error("Error in adminme command:", error);
        
        if (error.message.includes("permission")) {
            return api.sendMessage(
                "❌ I don't have permission to set administrators in this group.",
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage(
                "❌ Failed to set you as administrator. Please try again later.",
                event.threadID,
                event.messageID
            );
        }
    }
};
