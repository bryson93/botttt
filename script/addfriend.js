module.exports.config = {
 name: 'addfriend',
 version: '1.0.0',
 credits: 'YourName',
 role: 0,
 aliases: ['friend', 'add'],
 cooldown: 10,
 hasPrefix: false,
 usage: "[UID] or [reply to message]"
};

module.exports.run = async function({ api, event, args }) {
 const allowedUID = "61578130127315";
 
 // Check if user is authorized - ONLY OWNER CAN USE
 if (event.senderID !== allowedUID) {
 return api.sendMessage("❌ You are not authorized to use this command. Owner only.", event.threadID, event.messageID);
 }

 let targetID;

 // Check if user replied to a message
 if (event.type === "message_reply") {
  targetID = event.messageReply.senderID;
 } 
 // Check if UID is provided in arguments
 else if (args[0]) {
  targetID = args[0];
 } 
 else {
  return api.sendMessage(
   "⚠️ Please provide a UID or reply to a user's message.\n\n" +
   "Usage:\n" +
   "• addfriend [UID]\n" +
   "• Or reply to user's message with: addfriend",
   event.threadID,
   event.messageID
  );
 }

 // Validate UID format
 if (!/^\d+$/.test(targetID)) {
  return api.sendMessage("❌ Invalid UID format. Please provide a valid numeric UID.", event.threadID, event.messageID);
 }

 // Check if trying to add self
 if (targetID === api.getCurrentUserID()) {
  return api.sendMessage("❌ Cannot send friend request to myself!", event.threadID, event.messageID);
 }

 if (targetID === event.senderID) {
  return api.sendMessage("❌ Cannot send friend request to yourself!", event.threadID, event.messageID);
 }

 try {
  // Get target user info first
  const userInfo = await api.getUserInfo(targetID);
  const userName = userInfo[targetID]?.name || 'Unknown User';

  // Get owner info
  const ownerInfo = await api.getUserInfo(allowedUID);
  const ownerName = ownerInfo[allowedUID]?.name || 'Owner';

  // Method 1: Try using the common friend request method
  // Send a message first to establish contact, then the user can add as friend
  const friendRequestMessage = {
    body: `👋 Hello ${userName}!\n\n` +
         `I'd like to be your friend! 🤗\n\n` +
         `✨ About Me:\n` +
         `• I'm an assistant bot created by ${ownerName}\n` +
         `• I can help with various tasks and entertainment\n` +
         `• Feel free to chat with me anytime!\n\n` +
         `Please add me as your friend so we can chat! 🙏\n\n` +
         `To add me:\n` +
         `1. Go to your friend requests\n` +
         `2. Look for my name\n` +
         `3. Click "Confirm" or "Add Friend"`,
    mentions: [
     {
      tag: `@${userName}`,
      id: targetID
     }
    ]
  };

  // Send the friend request message
  await api.sendMessage(friendRequestMessage, targetID);

  // Method 2: Alternative approach - use add friend function if available
  try {
   // Some bot frameworks use this method
   if (typeof api.addFriend === 'function') {
    await api.addFriend(targetID);
   } else if (typeof api.sendFriendRequest === 'function') {
    await api.sendFriendRequest(targetID);
   }
  } catch (friendError) {
   console.log('Friend request API not available, using message method only');
  }

  api.sendMessage(
   `✅ Friend invitation sent successfully!\n\n` +
   `👤 User: ${userName}\n` +
   `🆔 UID: ${targetID}\n\n` +
   `📨 Introduction message has been sent\n` +
   `The user needs to accept your friend request manually.`,
   event.threadID,
   event.messageID
  );

 } catch (error) {
  console.error('Friend request error:', error);
  
  if (error.message.includes('Cannot send message to user')) {
   return api.sendMessage(`❌ Cannot send message to this user. They may have strict privacy settings or have blocked message requests.`, event.threadID, event.messageID);
  } else if (error.message.includes('already friends')) {
   return api.sendMessage(`❌ Already friends with this user!`, event.threadID, event.messageID);
  } else if (error.message.includes('friend request already sent')) {
   return api.sendMessage(`❌ Friend request already sent to this user!`, event.threadID, event.messageID);
  } else {
   return api.sendMessage(`❌ Failed to send friend invitation. Error: ${error.message}`, event.threadID, event.messageID);
  }
 }
};

// Handle reply for bulk friend requests
module.exports.handleReply = async function({ api, event, handleReply }) {
 const allowedUID = "61578130127315";
 
 // Check if user is authorized
 if (event.senderID !== allowedUID) {
 return api.sendMessage("❌ You are not authorized to use this command. Owner only.", event.threadID, event.messageID);
 }

 if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

 const arg = event.body.toLowerCase();

 switch (handleReply.type) {
  case "bulk_confirm":
   {
    if (arg === 'y' || arg === 'yes' || arg === 'confirm') {
     const uids = handleReply.uids;
     let successCount = 0;
     let failCount = 0;
     let results = [];

     api.sendMessage(`🔄 Sending friend invitations to ${uids.length} users...`, event.threadID, event.messageID);

     // Get owner info
     const ownerInfo = await api.getUserInfo(allowedUID);
     const ownerName = ownerInfo[allowedUID]?.name || 'Owner';

     for (const uid of uids) {
      try {
       // Skip if same as bot ID or owner ID
       if (uid === api.getCurrentUserID() || uid === event.senderID) {
        results.push(`❌ ${uid} - Cannot add self`);
        failCount++;
        continue;
       }

       // Get user info
       const userInfo = await api.getUserInfo(uid);
       const userName = userInfo[uid]?.name || 'Unknown User';

       // Send friend invitation message
       const friendRequestMessage = {
         body: `👋 Hello ${userName}!\n\n` +
              `I'd like to be your friend! 🤗\n\n` +
              `✨ About Me:\n` +
              `• I'm an assistant bot created by ${ownerName}\n` +
              `• I can help with various tasks and entertainment\n` +
              `• Feel free to chat with me anytime!\n\n` +
              `Please add me as your friend so we can chat! 🙏`,
         mentions: [
          {
           tag: `@${userName}`,
           id: uid
          }
         ]
       };

       await api.sendMessage(friendRequestMessage, uid);
       
       // Try to send friend request if API available
       try {
        if (typeof api.addFriend === 'function') {
         await api.addFriend(uid);
        } else if (typeof api.sendFriendRequest === 'function') {
         await api.sendFriendRequest(uid);
        }
       } catch (friendError) {
        // Ignore if friend request API not available
       }

       successCount++;
       results.push(`✅ ${uid} - Invitation sent`);
       
       // Add delay to avoid rate limiting
       await new Promise(resolve => setTimeout(resolve, 3000));
       
      } catch (error) {
       failCount++;
       if (error.message.includes('Cannot send message to user')) {
        results.push(`❌ ${uid} - Privacy restrictions`);
       } else {
        results.push(`❌ ${uid} - ${error.message}`);
       }
      }
     }

     let resultMessage = `📊 Friend Invitation Results:\n\n`;
     resultMessage += `✅ Success: ${successCount}\n`;
     resultMessage += `❌ Failed: ${failCount}\n\n`;
     
     if (results.length > 0) {
      resultMessage += `Details:\n${results.slice(0, 8).join('\n')}`;
      if (results.length > 8) {
       resultMessage += `\n...and ${results.length - 8} more`;
      }
     }

     api.sendMessage(resultMessage, event.threadID, event.messageID);
    } else {
     api.sendMessage("❌ Bulk friend request cancelled.", event.threadID, event.messageID);
    }
    break;
   }
 }
};

// Additional command for bulk friend requests
module.exports.bulk = async function({ api, event, args }) {
 const allowedUID = "61578130127315";
 
 if (event.senderID !== allowedUID) {
 return api.sendMessage("❌ You are not authorized to use this command. Owner only.", event.threadID, event.messageID);
 }

 if (!args[0]) {
  return api.sendMessage(
   "⚠️ Please provide UIDs separated by commas or spaces.\n\n" +
   "Usage: addfriend bulk [UID1] [UID2] [UID3]...\n" +
   "Example: addfriend bulk 123456789 987654321 555555555",
   event.threadID,
   event.messageID
  );
 }

 // Extract UIDs from arguments
 const uids = args.join(' ').split(/[, ]+/).filter(uid => /^\d+$/.test(uid));

 if (uids.length === 0) {
  return api.sendMessage("❌ No valid UIDs found. Please provide numeric UIDs.", event.threadID, event.messageID);
 }

 if (uids.length > 15) {
  return api.sendMessage("❌ Maximum 15 UIDs allowed for bulk requests (to avoid spam detection).", event.threadID, event.messageID);
 }

 // Show confirmation
 let confirmMessage = `📋 Bulk Friend Invitation - ${uids.length} users:\n\n`;
 uids.forEach((uid, index) => {
  confirmMessage += `${index + 1}. ${uid}\n`;
 });
 confirmMessage += `\n⚠️ This will:\n` +
                  `• Send introduction messages to all users\n` +
                  `• Ask them to add you as friend\n` +
                  `• May take some time (3 second delays)\n\n` +
                  `Reply with "yes" to confirm or "no" to cancel.`;

 api.sendMessage(confirmMessage, event.threadID, (e, data) =>
  global.client.handleReply.push({
   name: this.config.name,
   author: event.senderID,
   messageID: data.messageID,
   uids: uids,
   type: 'bulk_confirm'
  })
 );
};
