module.exports.config = {
  name: "thread",
  version: "1.0.0",
  credits: "bryson",
  role: 1,
  hasPrefix: true,
  description: "Thread settings - change avatar or name",
  usage: "{p}thread set avatar | {p}thread set name [new name]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const command = args[0];
  const subCommand = args[1];

  if (command !== "set") {
    return api.sendMessage("❌ Invalid command. Use: thread set [avatar/name]", event.threadID);
  }

  if (subCommand === "avatar") {
    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage("📸 Please reply to an image to set as group avatar.", event.threadID);
    }

    const imageURL = event.messageReply.attachments[0].url;
    try {
      await api.changeGroupImage(await getStreamFromURL(imageURL), event.threadID);
      return api.sendMessage("✅ Group avatar has been changed successfully!", event.threadID);
    } catch (error) {
      return api.sendMessage("❌ Failed to change group avatar. Please try again.", event.threadID);
    }
  }
  else if (subCommand === "name") {
    const newName = args.slice(2).join(" ");
    if (!newName) {
      return api.sendMessage("📝 Please provide a new name for the group.", event.threadID);
    }

    try {
      await api.setTitle(newName, event.threadID);
      return api.sendMessage(`✅ Group name has been changed to: ${newName}`, event.threadID);
    } catch (error) {
      return api.sendMessage("❌ Failed to change group name. Please try again.", event.threadID);
    }
  }
  else {
    return api.sendMessage("❌ Invalid option. Use: thread set [avatar/name]", event.threadID);
  }
};

function getStreamFromURL(url) {
  return global.nodemodule["axios"]({
    method: "get",
    url: url,
    responseType: "stream"
  }).then(res => res.data);
}
