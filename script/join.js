module.exports.config = {
    name: "join",
    version: "1.0.0",
    role: 2,
    hasPrefix: true,
    credits: "bryson",
    description: "Add admin to bot's group chat",
    commandCategory: "system",
    usages: "join [threadID]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const ADMIN_ID = "61578130127315"; // Bot admin ID
    
    if (args.length < 1) {
        return api.sendMessage(
            "❌ Please provide a thread ID.\nUsage: join [threadID]",
            event.threadID,
            event.messageID
        );
    }

    const threadID = args[0];
    
    try {
        // Add admin to the specified group
        await api.addUserToGroup(ADMIN_ID, threadID);
        
        return api.sendMessage(
            `✅ Successfully added admin to the group!\nThread ID: ${threadID}`,
            event.threadID,
            event.messageID
        );
        
    } catch (error) {
        console.error("Error in join command:", error);
        
        if (error.message.includes("Can't add users to this group")) {
            return api.sendMessage(
                "❌ Cannot add admin to this group. Possible reasons:\n• The group doesn't allow adding members\n• Admin is already in the group\n• Invalid thread ID\n• Bot doesn't have admin permission",
                event.threadID,
                event.messageID
            );
        } else if (error.message.includes("Cannot add non-friend")) {
            return api.sendMessage(
                "❌ Cannot add admin to this group. Admin needs to be friends with someone in the group first.",
                event.threadID,
                event.messageID
            );
        } else if (error.message.includes("spam")) {
            return api.sendMessage(
                "❌ Facebook is blocking this action due to spam prevention. Please try again later.",
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage(
                "❌ Failed to add admin to the group. Please check the thread ID and try again.",
                event.threadID,
                event.messageID
            );
        }
    }
};
