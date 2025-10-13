const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "welcome",
    version: "5.0.0",
    role: 0,
    description: "Welcome new members",
    credits: "bryson",
    hasEvent: true
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    const addedParticipants = event.logMessageData?.addedParticipants;
    if (!addedParticipants?.length) return;

    const groupInfo = await api.getThreadInfo(event.threadID);
    const groupName = groupInfo.threadName || "this group";
    const memberCount = groupInfo.participantIDs.length;

    const names = [];
    const userIDs = [];
    
    for (const participant of addedParticipants) {
        const userID = participant.userFbId || participant.userId || participant.id;
        if (!userID) continue;

        const info = await api.getUserInfo(userID);
        names.push(info[userID]?.name || "New Member");
        userIDs.push(userID);
    }

    // Check if the bot is among the added participants
    const botID = api.getCurrentUserID();
    const isBotAdded = addedParticipants.some(participant => 
        (participant.userFbId || participant.userId || participant.id) === botID
    );

    if (isBotAdded) {
        // Bot joining group message
        const botMessage = `⟡──────────────────────⟡
     BOT CONNECTION ESTABLISHED
⟡──────────────────────⟡

✔︎ AUTOBOT has joined this group ➣ ${groupName}

♕ Owner: Bryson 

💬 Type: help to view all functions.  

System running normally.
⟡──────────────────────⟡`;
        
        await api.sendMessage({
            body: botMessage
        }, event.threadID);
    } else {
        // User joining group message with mentions
        const welcomeMessage = `⟡──────────────────────⟡
  USER CONNECTION SUCCESSFULLY 
⟡──────────────────────⟡

A warm welcome to ${userIDs.map(id => `@${id}`).join(' ')}.  
You are now part of ${groupName}.  
  
Total members: ${memberCount}

Status: Active  
System: Running smoothly.
⟡──────────────────────⟡`;
        
        await api.sendMessage({
            body: welcomeMessage,
            mentions: userIDs.map((id, index) => ({
                tag: `@${names[index]}`,
                id: id
            }))
        }, event.threadID);
    }
};
