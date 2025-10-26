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
        // Bot joining group - Messenger bot style
        const botMessage = `🤖 Bot Activated

Hello! I'm now active in "${groupName}"

Commands: type "help"
Owner: Bryson
Status: ✅ Online`;
        
        await api.sendMessage({
            body: botMessage
        }, event.threadID);
    } else {
        // User joining group - Messenger notification style
        const userName = names.join(", ");
        const welcomeMessage = `👋 ${userName} joined the group

Group: ${groupName}
Total members: ${memberCount}

Welcome! 🎉`;
        
        await api.sendMessage({
            body: welcomeMessage
        }, event.threadID);
    }
};
