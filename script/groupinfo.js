module.exports.config = {
  name: "groupinfo",
  version: "1.0.0",
  credits: "bryson",
  role: 0,
  hasPrefix: true,
  description: "Get information about the current group",
  usage: "{p}groupinfo",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    
    const adminCount = threadInfo.adminIDs.length;
    const participantCount = threadInfo.participantIDs.length;
    
    // Get admin names
    let adminNames = [];
    for (const admin of threadInfo.adminIDs) {
      try {
        const userInfo = await api.getUserInfo(admin.id);
        adminNames.push(userInfo[admin.id]?.name || "Unknown");
      } catch (error) {
        adminNames.push("Unknown");
      }
    }
    
    const groupInfo = `👥 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡

📛 𝗡𝗮𝗺𝗲: ${threadInfo.threadName}
🆔 𝗜𝗗: ${event.threadID}
👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${participantCount}
🛡️ 𝗔𝗱𝗺𝗶𝗻𝘀: ${adminCount}
😊 𝗘𝗺𝗼𝗷𝗶: ${threadInfo.emoji}

👑 𝗔𝗱𝗺𝗶𝗻 𝗟𝗶𝘀𝘁:
${adminNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}`;

    // Send group avatar with the info
    if (threadInfo.imageSrc) {
      const avatarStream = await getStreamFromURL(threadInfo.imageSrc);
      api.sendMessage({
        body: groupInfo,
        attachment: avatarStream
      }, event.threadID);
    } else {
      api.sendMessage(groupInfo, event.threadID);
    }
    
  } catch (error) {
    console.error(error);
    api.sendMessage("❌ Failed to get group information. Please try again.", event.threadID);
  }
};

function getStreamFromURL(url) {
  return global.nodemodule["axios"]({
    method: "get",
    url: url,
    responseType: "stream"
  }).then(res => res.data);
}
