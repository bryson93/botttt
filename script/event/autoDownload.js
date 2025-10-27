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

  const endpoint = `https://api-library-kohi.onrender.com/api/alldl?url=${encodeURIComponent(input)}`;

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

    console.log("📦 API Response:", JSON.stringify(res.data, null, 2));

    const data = res.data;

    // Extract video URL based on common response structures
    let videoUrl = data.url || data.videoUrl || data.downloadUrl || 
                   data.video_url || data.download_url || data.mediaUrl ||
                   data.media_url || data.hd || data.sd || data.mp4 ||
                   data.hdQuality || data.sdQuality ||
                   data.result?.url || data.result?.videoUrl ||
                   data.data?.url || data.data?.videoUrl ||
                   data.links?.[0]?.url || data.videos?.[0]?.url;

    // If no direct URL found, try to find in nested structures
    if (!videoUrl && data.links && Array.isArray(data.links)) {
      const videoLink = data.links.find(link => 
        link.quality === 'hd' || link.quality === '720p' || link.quality === '1080p' ||
        link.type === 'video' || link.url.includes('.mp4')
      );
      videoUrl = videoLink?.url;
    }

    if (!videoUrl && data.videos && Array.isArray(data.videos)) {
      const video = data.videos.find(v => 
        v.quality === 'hd' || v.quality === '720p' || v.quality === '1080p' ||
        v.url.includes('.mp4')
      );
      videoUrl = video?.url;
    }

    // If still no URL, check if response has success data
    if (!videoUrl && data.success && data.data) {
      videoUrl = data.data.url || data.data.videoUrl || data.data.downloadUrl;
    }

    if (!videoUrl) {
      console.log("❌ No video URL found in response structure");
      return api.sendMessage(`❌ Could not extract video URL from ${platforms[matched]}. The API response structure might be different.`, event.threadID, event.messageID);
    }

    // Ensure the URL is valid
    if (!videoUrl.startsWith('http')) {
      console.log("❌ Invalid video URL:", videoUrl);
      return api.sendMessage("❌ Invalid video URL received from API.", event.threadID, event.messageID);
    }

    api.sendMessage(`📥 Downloading ${platforms[matched]} video...`, event.threadID, (err, info) => {
      setTimeout(() => api.unsendMessage(info.messageID), 5000);
    });

    const fileName = `download_${Date.now()}.mp4`;
    const filePath = __dirname + "/" + fileName;

    console.log(`📹 Downloading video from: ${videoUrl}`);

    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
      }
    });

    const file = fs.createWriteStream(filePath);
    response.data.pipe(file);

    file.on("finish", () => {
      file.close(() => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({
          body: `✅ ${platforms[matched]} Video Downloaded Successfully!\n\n🎬 Platform: ${platforms[matched]}\n📹 Video ready to watch!`,
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
    console.error("❌ API Error:", error.response?.data || error.message);
    
    let errorMessage = `❌ Failed to download from ${platforms[matched]}. `;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage += "API server is down.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage += "Request timed out.";
    } else if (error.response?.status === 404) {
      errorMessage += "API endpoint not found.";
    } else if (error.response?.status === 500) {
      errorMessage += "Server error.";
    } else if (error.response?.data) {
      errorMessage += `API Error: ${JSON.stringify(error.response.data)}`;
    } else {
      errorMessage += `Error: ${error.message}`;
    }
    
    api.sendMessage(errorMessage, event.threadID, event.messageID);
  }
};
