module.exports.config = {
  name: "anonymous",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: ["anon", "sendanon"],
  credits: "bryson",
  description: "Send completely anonymous message to user or thread by ID",
  commandCategory: "box chat",
  usages: "{p}anonymous [threadID or userID] [message]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  if (args.length < 2) {
    return api.sendMessage(
      "❌ Wrong format!\nUse: anonymous [threadID/userID] [message]",
      event.threadID,
      event.messageID
    );
  }

  const receiverID = args[0]; 
  const message = args.slice(1).join(" ");

  api.sendMessage(
    {
      body: `📩 Anonymous Message:\n\n${message}\n\n💬 This message was sent anonymously.`,
    },
    receiverID,
    (err) => {
      if (err) {
        return api.sendMessage(
          `⚠️ Failed to send anonymous message to ID: ${receiverID}\nError: ${err.error}`,
          event.threadID,
          event.messageID
        );
      }
      api.sendMessage(
        `✅ Successfully sent anonymous message to ID: ${receiverID}\nMessage: "${message}"`,
        event.threadID,
        event.messageID
      );
    }
  );
};
