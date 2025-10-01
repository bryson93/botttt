module.exports.config = {
 name: 'called',
 version: '1.0.0',
 credits: 'bry',
 role: 0,
 aliases: ['contact', 'report', 'messageadmin'],
 cooldown: 30,
 hasPrefix: false,
 usage: "[message]"
};

module.exports.run = async function({ api, event, args }) {
 const adminUID = "61578130127315";
 
 if (!args[0]) {
  return api.sendMessage(
   "📞 Contact Admin/Owner\n\n" +
   "Usage: called [your message]\n" +
   "Example: called Hello admin, I need help with something\n\n" +
   "This will send your message directly to the bot owner.",
   event.threadID,
   event.messageID
  );
 }

 const userMessage = args.join(' ');
 const userName = await getUserName(api, event.senderID);
 const userThreadName = await getThreadName(api, event.threadID);

 try {
  // Send message to admin
  const adminMessage = {
   body: `📞 NEW MESSAGE FROM USER\n\n` +
        `👤 User: ${userName}\n` +
        `🆔 User ID: ${event.senderID}\n` +
        `💬 Thread: ${userThreadName}\n` +
        `🆔 Thread ID: ${event.threadID}\n\n` +
        `📝 Message:\n${userMessage}\n\n` +
        `⏰ Time: ${new Date().toLocaleString()}`,
   mentions: [
    {
     tag: `@${userName}`,
     id: event.senderID
    }
   ]
  };

  await api.sendMessage(adminMessage, adminUID);

  // Confirm to user
  api.sendMessage(
   `✅ Your message has been sent to the admin!\n\n` +
   `📝 Your message: "${userMessage}"\n\n` +
   `The admin will respond to you as soon as possible. Thank you! 🙏`,
   event.threadID,
   event.messageID
  );

 } catch (error) {
  console.error('Contact admin error:', error);
  api.sendMessage(
   "❌ Failed to send message to admin. Please try again later.",
   event.threadID,
   event.messageID
  );
 }
};

// Handle reply from admin to user
module.exports.handleReply = async function({ api, event, handleReply }) {
 const adminUID = "61578130127315";
 
 // Only admin can use reply feature
 if (event.senderID !== adminUID) return;

 if (handleReply.type === "admin_reply") {
  const adminMessage = event.body;
  const targetUserID = handleReply.userID;
  const targetThreadID = handleReply.threadID;
  
  try {
   // Get admin info
   const adminInfo = await api.getUserInfo(event.senderID);
   const adminName = adminInfo[event.senderID]?.name || 'Admin';

   // Send reply to user
   const replyMessage = {
    body: `📨 REPLY FROM ADMIN\n\n` +
         `👤 From: ${adminName}\n\n` +
         `💬 Message:\n${adminMessage}\n\n` +
         `⏰ ${new Date().toLocaleString()}`,
    mentions: [
     {
      tag: `@${adminName}`,
      id: event.senderID
     }
    ]
   };

   await api.sendMessage(replyMessage, targetThreadID);

   // Confirm to admin
   api.sendMessage(
    `✅ Reply sent successfully to user!\n\n` +
    `👤 User ID: ${targetUserID}\n` +
    `📝 Your reply: "${adminMessage}"`,
    event.threadID,
    event.messageID
   );

  } catch (error) {
   console.error('Admin reply error:', error);
   api.sendMessage(
    "❌ Failed to send reply to user. They may have left the chat or blocked the bot.",
    event.threadID,
    event.messageID
   );
  }
 }
};

// Admin command to view pending messages or contact users
module.exports.messages = async function({ api, event, args }) {
 const adminUID = "61578130127315";
 
 // Only admin can use this
 if (event.senderID !== adminUID) {
  return api.sendMessage("❌ Admin only command.", event.threadID, event.messageID);
 }

 // This can be extended to show message history
 api.sendMessage(
  "📋 Message Management\n\n" +
  "To reply to a user, simply reply to their contact message with:\n" +
  "• called reply [message]\n\n" +
  "Or use:\n" +
  "• called user [UID] - to contact specific user",
  event.threadID,
  event.messageID
 );
};

// Admin command to contact specific user
module.exports.user = async function({ api, event, args }) {
 const adminUID = "61578130127315";
 
 if (event.senderID !== adminUID) {
  return api.sendMessage("❌ Admin only command.", event.threadID, event.messageID);
 }

 if (args.length < 2) {
  return api.sendMessage(
   "Usage: called user [UID] [message]\n" +
   "Example: called user 123456789 Hello, how can I help you?",
   event.threadID,
   event.messageID
  );
 }

 const targetUID = args[0];
 const adminMessage = args.slice(1).join(' ');

 try {
  // Get user info
  const userInfo = await api.getUserInfo(targetUID);
  const userName = userInfo[targetUID]?.name || 'Unknown User';

  // Get admin info
  const adminInfo = await api.getUserInfo(adminUID);
  const adminName = adminInfo[adminUID]?.name || 'Admin';

  const messageToUser = {
   body: `📨 MESSAGE FROM ADMIN\n\n` +
        `👤 From: ${adminName}\n\n` +
        `💬 Message:\n${adminMessage}\n\n` +
        `⏰ ${new Date().toLocaleString()}`,
   mentions: [
    {
     tag: `@${adminName}`,
     id: adminUID
    }
   ]
  };

  await api.sendMessage(messageToUser, targetUID);

  api.sendMessage(
   `✅ Message sent to user!\n\n` +
   `👤 User: ${userName}\n` +
   `🆔 UID: ${targetUID}\n` +
   `📝 Message: "${adminMessage}"`,
   event.threadID,
   event.messageID
  );

 } catch (error) {
  console.error('Admin contact user error:', error);
  api.sendMessage(
   `❌ Failed to send message to user ${targetUID}. They may have privacy restrictions.`,
   event.threadID,
   event.messageID
  );
 }
};

// Helper functions
async function getUserName(api, userID) {
 try {
  const userInfo = await api.getUserInfo(userID);
  return userInfo[userID]?.name || 'Unknown User';
 } catch (error) {
  return 'Unknown User';
 }
}

async function getThreadName(api, threadID) {
 try {
  const threadInfo = await api.getThreadInfo(threadID);
  return threadInfo.name || 'Personal Chat';
 } catch (error) {
  return 'Personal Chat';
 }
}

// Handle when admin replies to a user's contact message
module.exports.handleEvent = async function({ api, event }) {
 const adminUID = "61578130127315";
 
 // Check if admin is replying to a contact message
 if (event.type === "message_reply" && event.senderID === adminUID) {
  const repliedMessage = event.messageReply;
  
  // Check if this is a contact message from user
  if (repliedMessage.body && repliedMessage.body.includes('📞 NEW MESSAGE FROM USER')) {
   const quickReply = event.body;
   
   if (quickReply && !quickReply.startsWith('!') && !quickReply.startsWith('/')) {
    // Extract user ID from the mentions in the original message
    let targetUserID = event.senderID; // fallback to admin ID
    if (repliedMessage.mentions && repliedMessage.mentions.length > 0) {
     targetUserID = repliedMessage.mentions[0].id;
    }
    
    // Admin is replying to contact message, offer quick reply option
    api.sendMessage(
     `💡 Quick Reply Detected!\n\n` +
     `You're replying to a user's contact message.\n` +
     `To send your reply, type:\n` +
     `• called reply ${quickReply}\n\n` +
     `Or just continue typing your reply and use the command when ready.`,
     event.threadID,
     (e, data) => {
      // Store the reply context for easy handling
      global.client.handleReply.push({
       name: this.config.name,
       author: event.senderID,
       messageID: data.messageID,
       userID: targetUserID,
       threadID: repliedMessage.threadID,
       type: 'admin_reply'
      });
     }
    );
   }
  }
 }
};

// Admin quick reply command
module.exports.reply = async function({ api, event, args }) {
 const adminUID = "61578130127315";
 
 if (event.senderID !== adminUID) {
  return api.sendMessage("❌ Admin only command.", event.threadID, event.messageID);
 }

 if (!args[0]) {
  return api.sendMessage(
   "Usage: called reply [message]\n" +
   "Example: called reply Hello, I received your message!",
   event.threadID,
   event.messageID
  );
 }

 const replyMessage = args.join(' ');
 
 // This would need to be connected to your message storage system
 // For now, it will show instructions
 api.sendMessage(
  "📝 Quick Reply System\n\n" +
  "To use the reply feature:\n" +
  "1. First, reply to a user's contact message\n" +
  "2. Then use this command with your message\n\n" +
  "For now, you can contact users directly using:\n" +
  "• called user [UID] [message]",
  event.threadID,
  event.messageID
 );
};
