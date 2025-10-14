module.exports.config = {
    name: "autopost",
    version: "1.0.0",
    role: 2,
    hasPrefix: true,
    credits: "bryson",
    description: "Auto post with scheduled time and date",
    usage: "{p}autopost on/off",
    cooldowns: 5
};

const fs = require("fs-extra");
const path = require("path");

const autopostFile = path.join(__dirname, "autopost_data.json");

module.exports.run = async function ({ api, event, args }) {
    const { threadID } = event;
    const command = args[0]?.toLowerCase();

    if (command === "on") {
        try {
            let autopostData = {};
            if (fs.existsSync(autopostFile)) {
                autopostData = fs.readJsonSync(autopostFile);
            }
            
            autopostData[threadID] = true;
            fs.writeJsonSync(autopostFile, autopostData);
            
            return api.sendMessage("✅ Auto-post has been activated for this thread.", threadID);
        } catch (error) {
            return api.sendMessage("❌ Failed to activate auto-post.", threadID);
        }
    }
    else if (command === "off") {
        try {
            let autopostData = {};
            if (fs.existsSync(autopostFile)) {
                autopostData = fs.readJsonSync(autopostFile);
            }
            
            autopostData[threadID] = false;
            fs.writeJsonSync(autopostFile, autopostData);
            
            return api.sendMessage("❌ Auto-post has been deactivated for this thread.", threadID);
        } catch (error) {
            return api.sendMessage("❌ Failed to deactivate auto-post.", threadID);
        }
    }
    else {
        return api.sendMessage("📝 Usage: autopost [on/off]", threadID);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.type !== "message" || event.body?.startsWith("autopost")) return;

    try {
        if (!fs.existsSync(autopostFile)) return;
        
        const autopostData = fs.readJsonSync(autopostFile);
        const threadID = event.threadID;
        
        if (autopostData[threadID]) {
            const currentTime = new Date();
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            
            // Auto-post messages for different times
            const messageSchedule = {
                6: [ // 6:00 AM
                    "🌅 Good morning! Rise and shine!",
                    "☀️ Morning everyone! New day, new opportunities!",
                    "🌞 Good morning! Hope you all slept well!",
                    "🌄 Wakey wakey! It's a brand new day!",
                    "🍳 Morning! Time for breakfast and productivity!"
                ],
                8: [ // 8:00 AM
                    "🕗 Good morning! Have a great day ahead!",
                    "💼 Morning everyone! Let's make today productive!",
                    "📚 Good morning students! Time to study!",
                    "🏢 Morning workers! Have a productive day!",
                    "🌤️ Good morning! Don't forget your morning coffee!"
                ],
                12: [ // 12:00 PM
                    "🕛 It's noon! Lunch time everyone! 🍽️",
                    "🍱 Noon time! Take a break and eat well!",
                    "🌮 Good afternoon! Time for lunch break!",
                    "🍜 Noon everyone! Fuel up for the afternoon!",
                    "🥗 Lunch time! Eat healthy and stay energized!"
                ],
                15: [ // 3:00 PM
                    "🕒 Afternoon everyone! How's your day going?",
                    "☕ Afternoon break! Time for some coffee!",
                    "📊 Mid-afternoon! Stay focused and productive!",
                    "🌇 Good afternoon! Hope you're having a great day!",
                    "💪 Afternoon motivation! Keep pushing forward!"
                ],
                18: [ // 6:00 PM
                    "🕕 Good evening! Time to relax after work!",
                    "🌆 Evening everyone! How was your day?",
                    "🍽️ Good evening! Dinner time soon!",
                    "📺 Evening relaxation! Time to unwind!",
                    "🌃 Good evening! Hope you had a productive day!"
                ],
                21: [ // 9:00 PM
                    "🕘 Good night everyone! Sleep well! 🌙",
                    "🌜 Night time! Rest well for tomorrow!",
                    "🛌 Good night! Sweet dreams everyone!",
                    "💤 Late night! Don't stay up too late!",
                    "🌠 Good night! See you all tomorrow!"
                ]
            };

            if (messageSchedule[hours] && minutes === 0) {
                const messages = messageSchedule[hours];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                
                api.sendMessage(`📢 Auto-post:\n\n${randomMessage}\n\n⏰ ${currentTime.toLocaleString()}`, threadID);
            }
        }
    } catch (error) {
        console.error("Auto-post error:", error);
    }
};
