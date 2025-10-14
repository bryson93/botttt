const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

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
    for (const participant of addedParticipants) {
        const userID = participant.userFbId || participant.userId || participant.id;
        if (!userID) continue;

        const info = await api.getUserInfo(userID);
        names.push(info[userID]?.name || "New Member");
    }

    // Check if the bot is among the added participants
    const botID = api.getCurrentUserID();
    const isBotAdded = addedParticipants.some(participant => 
        (participant.userFbId || participant.userId || participant.id) === botID
    );

    if (isBotAdded) {
        // Bot joining group message
        const botMessage = `
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦
          🤖 BOT JOINED 🤖
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦

🎯 AUTOBOT joined: ${groupName}

👑 Owner: Bryson 
💡 Type: help for commands

✅ System running normally.
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦
        `;
        
        await api.sendMessage({
            body: botMessage
        }, event.threadID);
    } else {
        // User joining group message
        const userName = names.join(", ");
        const welcomeMessage = `
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦
        🎉 WELCOME 🎉
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦

👋 Welcome ${userName}
📌 to ${groupName}

👥 Members: ${memberCount}

🟢 Status: Active
✦┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈✦
        `;
        
        await api.sendMessage({
            body: welcomeMessage
        }, event.threadID);
    }
};
