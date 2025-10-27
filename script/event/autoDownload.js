module.exports.config = {
  name: "autodownload",
  eventType: ["message"],
  version: "1.0.0",
  credits: "bryson",
  description: "Auto download from TikTok, YouTube, Facebook, IG, X, etc.",
  cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
  const fs = require("fs");
  const axios = require("axios");

  const input = event.body;
  if (!input) return;

  const platforms = {
    "x.com": "Twitter",
    "twitter.com": "Twitter", 
    "pin.it": "Pinterest",
    "pinterest.com": "Pinterest",
    "capcut.com": "CapCut",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "reddit.com": "Reddit",
    "snapchat.com": "Snapchat",
    "facebook.com": "Facebook",
    "fb.watch": "Facebook",
    "tiktok.com": "TikTok",
    "vt.tiktok.com": "TikTok",
    "vm.tiktok.com": "TikTok",
    "instagram.com": "Instagram"
  };

  const matched = Object.keys(platforms).find(key => input.includes(key));
  if (!matched) return;

  const endpoint = `https://arychauhann.onrender.com/api/allinonedownloader?url=${encodeURIComponent(input)}`;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  api.sendTypingIndicator(event.threadID, true);

  try {
    console.log(`🔄 Fetching from: ${endpoint}`);
    
    const res = await axios.get(endpoint, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log("📦 Raw API Response:", res.data);

    // Deep search for video URL in the response
    const findVideoUrl = (obj) => {
      if (typeof obj === 'string' && obj.match(/\.(mp4|mov|avi|mkv|webm)/i)) {
        return obj;
      }
      if (typeof obj === 'string' && obj.startsWith('http')) {
        return obj;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          if (typeof obj[key] === 'string' && obj[key].match(/\.(mp4|mov|avi|mkv|webm)/i)) {
            return obj[key];
          }
          if (typeof obj[key] === 'string' && obj[key].startsWith('http')) {
            const result = findVideoUrl(obj[key]);
            if (result) return result;
          }
          if (typeof obj[key] === 'object') {
            const result = findVideoUrl(obj[key]);
            if (result) return result;
          }
        }
      }
      return null;
    };

    let videoUrl = findVideoUrl(res.data);

    if (!videoUrl) {
      console.log("🔍 No video URL found in:", JSON.stringify(res.data, null, 2));
      return api.sendMessage(`❌ Could not extract video URL from ${platforms[matched]}. The API might not support this platform.`, event.threadID, event.messageID);
    }

    api.sendMessage(`📥 Downloading ${platforms[matched]} video...`, event.threadID, (err, info) => {
      setTimeout(() => api.unsendMessage(info.messageID), 5000);
    });

    const fileName = `download_${Date.now()}.mp4`;
    const filePath = __dirname + "/" + fileName;

    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
      timeout: 60000
    });

    const file = fs.createWriteStream(filePath);
    response.data.pipe(file);

    file.on("finish", () => {
      file.close(() => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({
          body: `✅ ${platforms[matched]} Video Downloaded\n📹 Successfully saved!`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error("Cleanup error:", e);
          }
        });
      });
    });

    file.on("error", (err) => {
      console.error("Download error:", err);
      api.sendMessage("❌ Error while downloading the video file.", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error("❌ Full Error:", error.message);
    api.sendMessage(`❌ Failed to download from ${platforms[matched]}. Error: ${error.message}`, event.threadID, event.messageID);
  }
};
