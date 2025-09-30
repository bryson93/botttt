const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "supportgc",
    version: "1.0.0",
    role: 0,
    description: "Add user to support group chat",
    credits: "bryson",
    hasPrefix: false,
    cooldown: 5,
    aliases: ["support", "helpgroup", "supportgroup"]
};

module.exports.run = async function ({ api, event, args }) {
    // Your support group thread ID
    const SUPPORT_GROUP_TID = "1108276584837413";
    
    // Bot owner ID
    const BOT_OWNER_ID = "61578130127315";

    const userID = event.senderID;
    
    try {
        // Get user info
        const userInfo = await api.getUserInfo(userID);
        const userName = userInfo[userID]?.name || "User";
        
        // Get support group info
        const groupInfo = await api.getThreadInfo(SUPPORT_GROUP_TID);
        const groupName = groupInfo.threadName || "Support Group";
        
        // Check if user is already in the group
        const participantIDs = groupInfo.participantIDs || [];
        if (participantIDs.includes(userID)) {
            return api.sendMessage(
                `🤖 You are already in our support group: "${groupName}"\n\nPlease check your messages or group list.`,
                event.threadID,
                event.messageID
            );
        }
        
        // Add user to support group
        await api.addUserToGroup(userID, SUPPORT_GROUP_TID);
        
        // Send confirmation to user
        await api.sendMessage(
            `✅ Success! I've added you to our support group: "${groupName}"\n\nPlease check your messages or group list. Our team will assist you there.`,
            event.threadID,
            event.messageID
        );
        
        // Notify support group
        await api.sendMessage(
            `👋 New user joined support group!\n\nName: ${userName}\nID: ${userID}\n\nPlease welcome and assist them.`,
            SUPPORT_GROUP_TID
        );
        
        console.log(`Added user ${userName} (${userID}) to support group ${SUPPORT_GROUP_TID}`);
        
    } catch (error) {
        console.error("Error in supportgc command:", error);
        
        if (error.message.includes("Can't add users to this group")) {
            return api.sendMessage(
                "❌ I cannot add users to the support group. Please make sure:\n• I have admin permissions in the support group\n• The group allows adding members\n• Or contact the bot owner directly",
                event.threadID,
                event.messageID
            );
        } else if (error.message.includes("Cannot add non-friend")) {
            return api.sendMessage(
                "❌ I cannot add you because we are not friends on Facebook.\n\nPlease send me a friend request first, then try again.\nOr contact the bot owner directly.",
                event.threadID,
                event.messageID
            );
        } else if (error.message.includes("spam")) {
            return api.sendMessage(
                "❌ Facebook is blocking this action due to spam prevention. Please try again later or contact the bot owner directly.",
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage(
                "❌ Failed to add you to the support group. Please try again later or contact the bot owner directly.",
                event.threadID,
                event.messageID
            );
        }
    }
};

// Optional: Command to set support group ID (bot owner only)
module.exports.onChat = async function ({ api, event, args }) {
    // Only allow bot owner to set support group ID via command
    const BOT_OWNER_ID = "61578130127315";
    
    if (event.senderID !== BOT_OWNER_ID) return;
    
    if (event.body && event.body.startsWith('setsupport')) {
        const newSupportTID = event.body.split(' ')[1];
        
        if (!newSupportTID) {
            return api.sendMessage(
                "Usage: setsupport [thread_id]\nExample: setsupport 1234567890123456",
                event.threadID,
                event.messageID
            );
        }
        
        // Update the support group ID in this file
        try {
            const filePath = path.join(__dirname, 'supportgc.js');
            let fileContent = fs.readFileSync(filePath, 'utf8');
            
            // Replace the support group ID in the file
            const updatedContent = fileContent.replace(
                /const SUPPORT_GROUP_TID = ".*?";/,
                `const SUPPORT_GROUP_TID = "${newSupportTID}";`
            );
            
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            
            await api.sendMessage(
                `✅ Support group ID updated to: ${newSupportTID}\n\nPlease restart the bot for changes to take effect.`,
                event.threadID,
                event.messageID
            );
            
        } catch (error) {
            console.error("Error updating support group ID:", error);
            await api.sendMessage(
                "❌ Failed to update support group ID. Please check the console for details.",
                event.threadID,
                event.messageID
            );
        }
    }
};
