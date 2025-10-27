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

  const API_BASE = "https://arychauhann.onrender.com/api/allinonedownloader";

  const input = event.body;
  if (!input) return;

  const platforms = {
    "x.com": "twitter",
    "twitter.com": "twitter",
    "pin.it": "pinterest",
    "pinterest.com": "pinterest",
    "capcut.com": "capcut",
    "youtube.com": "youtube",
    "youtu.be": "youtube",
    "reddit.com": "reddit",
    "snapchat.com": "snapchat",
    "facebook.com": "facebook",
    "fb.watch": "facebook",
    "tiktok.com": "tiktok",
    "vt.tiktok.com": "tiktok",
    "vm.tiktok.com": "tiktok",
    "instagram.com": "instagram"
  };

  const matched = Object.keys(platforms).find(key => input.includes(key));
  if (!matched) return;

  const endpoint = `${API_BASE}?url=${encodeURIComponent(input)}`;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);
  api.sendTypingIndicator(event.threadID, true);

  try {
    const res = await axios.get(endpoint);
    const data = res.data;

    console.log("API Response:", JSON.stringify(data, null, 2));

    // Try multiple possible field names for video URL
    let videoUrl = data.videoUrl || data.url || data.downloadUrl || 
                   data.video_url || data.download_url || data.mediaUrl ||
                   data.media_url || data.hd || data.sd || data.mp4 ||
                   data.result?.videoUrl || data.result?.url ||
                   data.data?.videoUrl || data.data?.url;

    // If videoUrl is still not found, check if the response itself is a URL
    if (!videoUrl && typeof data === 'string' && data.startsWith('http')) {
      videoUrl = data;
    }

    // If videoUrl is an object, try to extract from it
    if (videoUrl && typeof videoUrl === 'object') {
      videoUrl = videoUrl.url || videoUrl.videoUrl || videoUrl.downloadUrl;
    }

    if (!videoUrl) {
      console.log("Available data fields:", Object.keys(data));
      return api.sendMessage("❌ Could not find video URL in API response. The API might have changed.", event.threadID, event.messageID);
    }

    api.sendMessage("📥 Downloading video...", event.threadID, (err, info) => {
      setTimeout(() => api.unsendMessage(info.messageID), 10000);
    });

    const fileName = `${Date.now()}.mp4`;
    const filePath = __dirname + "/" + fileName;

    // Download the video
    const videoStream = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
      timeout: 60000
    }).then(res => res.data);

    const file = fs.createWriteStream(filePath);
    videoStream.pipe(file);

    file.on("finish", () => {
      file.close(() => {
        setTimeout(() => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          api.sendMessage({
            body: `✅ Video downloaded successfully from ${matched}\n\n📹 ${platforms[matched].toUpperCase()} Video`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => {
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              console.error("Error deleting file:", e);
            }
          });
        }, 2000);
      });
    });

    file.on("error", (err) => {
      console.error("File download error:", err);
      api.sendMessage("❌ Error downloading video file.", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    
    let errorMessage = "❌ Failed to download video. ";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage += "API server is down.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage += "Request timed out.";
    } else if (error.response?.status === 404) {
      errorMessage += "API endpoint not found.";
    } else if (error.response?.status === 500) {
      errorMessage += "Server error.";
    } else {
      errorMessage += "Please try again later.";
    }
    
    api.sendMessage(errorMessage, event.threadID, event.messageID);
  }
};
