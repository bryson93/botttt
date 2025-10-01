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

 try {
  // Get target user info first
  const userInfo = await api.getUserInfo(targetID);
  const userName = userInfo[targetID]?.name || 'Unknown User';

  // Get owner info
  const ownerInfo = await api.getUserInfo(allowedUID);
  const ownerName = ownerInfo[allowedUID]?.name || 'Owner';

  // Send friend request
  await api.addFriend(targetID);

  // Send message to the user
  const friendRequestMessage = {
    body: `👋 Hello ${userName}!\n\n` +
         `I sent you a friend request! 🤗\n\n` +
         `✨ About Me:\n` +
         `• I'm an assistant bot\n` +
         `• I can help with various tasks\n` +
         `• Feel free to chat with me!\n\n` +
         `Added by: ${ownerName}\n` +
         `Please accept my friend request! 🙏`,
    mentions: [
     {
      tag: `@${userName}`,
      id: targetID
     }
    ]
  };

  // Try to send message to the user
  try {
   await api.sendMessage(friendRequestMessage, targetID);
  } catch (messageError) {
   console.log('Cannot send message to user, probably not friends yet or privacy settings');
  }

  api.sendMessage(
   `✅ Friend request sent successfully!\n\n` +
   `👤 User: ${userName}\n` +
   `🆔 UID: ${targetID}\n\n` +
   `📨 Message has been sent to the user\n` +
   `Waiting for user to accept the friend request...`,
   event.threadID,
   event.messageID
  );

 } catch (error) {
  console.error('Friend request error:', error);
  
  if (error.message.includes('already friends')) {
   return api.sendMessage(`❌ Already friends with this user!`, event.threadID, event.messageID);
  } else if (error.message.includes('friend request already sent')) {
   return api.sendMessage(`❌ Friend request already sent to this user!`, event.threadID, event.messageID);
  } else if (error.message.includes('cannot add yourself')) {
   return api.sendMessage(`❌ Cannot send friend request to yourself!`, event.threadID, event.messageID);
  } else {
   return api.sendMessage(`❌ Failed to send friend request. Error: ${error.message}`, event.threadID, event.messageID);
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
     let messageSentCount = 0;
     let results = [];

     api.sendMessage(`🔄 Sending ${uids.length} friend requests with messages...`, event.threadID, event.messageID);

     // Get owner info
     const ownerInfo = await api.getUserInfo(allowedUID);
     const ownerName = ownerInfo[allowedUID]?.name || 'Owner';

     for (const uid of uids) {
      try {
       // Get user info
       const userInfo = await api.getUserInfo(uid);
       const userName = userInfo[uid]?.name || 'Unknown User';

       // Send friend request
       await api.addFriend(uid);

       // Send message to the user
       const friendRequestMessage = {
         body: `👋 Hello ${userName}!\n\n` +
              `I sent you a friend request! 🤗\n\n` +
              `✨ About Me:\n` +
              `• I'm an assistant bot\n` +
              `• I can help with various tasks\n` +
              `• Feel free to chat with me!\n\n` +
              `Added by: ${ownerName}\n` +
              `Please accept my friend request! 🙏`,
         mentions: [
          {
           tag: `@${userName}`,
           id: uid
          }
         ]
       };

       try {
        await api.sendMessage(friendRequestMessage, uid);
        messageSentCount++;
        results.push(`✅ ${uid} - Request sent + Message sent`);
       } catch (messageError) {
        results.push(`✅ ${uid} - Request sent (No message)`);
       }

       successCount++;
       
       // Add delay to avoid rate limiting
       await new Promise(resolve => setTimeout(resolve, 2000));
       
      } catch (error) {
       failCount++;
       if (error.message.includes('already friends')) {
        results.push(`❌ ${uid} - Already friends`);
       } else if (error.message.includes('friend request already sent')) {
        results.push(`❌ ${uid} - Request already sent`);
       } else {
        results.push(`❌ ${uid} - ${error.message}`);
       }
      }
     }

     let resultMessage = `📊 Friend Request Results:\n\n`;
     resultMessage += `✅ Success: ${successCount}\n`;
     resultMessage += `📨 Messages Sent: ${messageSentCount}\n`;
     resultMessage += `❌ Failed: ${failCount}\n\n`;
     
     if (results.length > 0) {
      resultMessage += `Details:\n${results.slice(0, 10).join('\n')}`;
      if (results.length > 10) {
       resultMessage += `\n...and ${results.length - 10} more`;
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

 if (uids.length > 20) {
  return api.sendMessage("❌ Maximum 20 UIDs allowed for bulk requests (to avoid spam).", event.threadID, event.messageID);
 }

 // Show confirmation
 let confirmMessage = `📋 Bulk Friend Request - ${uids.length} users:\n\n`;
 uids.forEach((uid, index) => {
  confirmMessage += `${index + 1}. ${uid}\n`;
 });
 confirmMessage += `\n⚠️ This will:\n` +
                  `• Send friend requests to all users\n` +
                  `• Send a welcome message to each user\n` +
                  `• May take some time\n\n` +
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
