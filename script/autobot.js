module.exports.config = {
    name: "autobot",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    credits: "bryson",
    description: "Create your own bot",
    commandCategory: "utility",
    usages: "autobot",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    const message = `❖━━━━━━━━━━━━━━━━━━━━━━━━━━❖
        ✦ CREATE YOUR OWN BOT ✦
❖━━━━━━━━━━━━━━━━━━━━━━━━━━❖
Build and customize your own bot.  
Start creating now through the link below:  
⟡ https://automated-chatbot-61a3.onrender.com/ ⟡  
❖━━━━━━━━━━━━━━━━━━━━━━━━━━❖`;
    
    api.sendMessage(message, event.threadID, event.messageID);
};
