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

    // Extract video URL based on platform
    let videoUrl;

    switch (platforms[matched]) {
      case "twitter":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "pinterest":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "capcut":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "youtube":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "reddit":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "snapchat":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "facebook":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "tiktok":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      case "instagram":
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
        break;
      default:
        videoUrl = data.videoUrl || data.url || data.downloadUrl;
    }

    if (!videoUrl) {
      return api.sendMessage("❌ Failed to retrieve video URL from the API response.", event.threadID, event.messageID);
    }

    api.sendMessage("📥 Downloading video...", event.threadID, (err, info) => {
      setTimeout(() => api.unsendMessage(info.messageID), 10000);
    });

    const fileName = `${Date.now()}.mp4`;
    const filePath = __dirname + "/" + fileName;

    const videoStream = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream"
    }).then(res => res.data);

    const file = fs.createWriteStream(filePath);
    videoStream.pipe(file);

    file.on("finish", () => {
      file.close(() => {
        setTimeout(() => {
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          api.sendMessage({
            body: `✅ Video downloaded successfully from ${matched}`,
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath));
        }, 5000);
      });
    });

    file.on("error", (err) => {
      console.error("File error:", err);
      api.sendMessage("❌ Error saving video file.", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    api.sendMessage("❌ Failed to download video. The API might be down or the URL is invalid.", event.threadID, event.messageID);
  }
};
