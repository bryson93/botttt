const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["music", "song"],
  description: "Search and download music from YouTube.",
  usage: "spotify [song name]",
  credits: "bryson",
  cooldown: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const threadID = event.threadID;
  const messageID = event.messageID;
  const senderID = event.senderID;

  if (!args[0]) {
    return api.sendMessage("❌ Please provide a song name.\n\nUsage: spotify [song name]", threadID, messageID);
  }

  const keyword = encodeURIComponent(args.join(" "));
  const searchURL = `https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${keyword}`;

  const waitingMsg = await api.sendMessage("🎵 Searching for music...", threadID);

  try {
    console.log(`🔍 Searching: ${searchURL}`);
    
    const searchRes = await axios.get(searchURL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = searchRes.data;
    console.log("📦 API Response:", JSON.stringify(data, null, 2));

    // Check if response has data
    if (!data) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from API.", threadID, messageID);
    }

    // Extract track information from YouTube API response
    let track = data.data || data.result || data;
    
    if (!track) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ No music found for your search.", threadID, messageID);
    }

    // Extract information from YouTube response
    const title = track.title || track.videoTitle || track.name || "Unknown Title";
    const artist = track.channel || track.author || track.artist || track.uploader || "Unknown Artist";
    const duration = track.duration || track.length || "";
    const thumbnail = track.thumbnail || track.thumb || track.cover || track.image;
    
    // Extract audio URL - YouTube APIs usually provide direct download links
    let audioUrl = track.audio || track.url || track.downloadUrl || track.audioUrl || 
                   track.download_link || track.link;

    // If no direct audio URL, check for formats array
    if (!audioUrl && track.formats && Array.isArray(track.formats)) {
      // Prefer audio-only formats
      const audioFormat = track.formats.find(format => 
        format.mimeType && format.mimeType.includes('audio') ||
        format.quality === 'audio'
      );
      audioUrl = audioFormat?.url;
    }

    console.log(`🎵 Found: ${title} by ${artist}`);
    console.log(`⏱️ Duration: ${duration}`);
    console.log(`🔗 Audio URL: ${audioUrl}`);

    if (!audioUrl) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ No audio URL found in the API response.", threadID, messageID);
    }

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail if available
    if (thumbnail) {
      try {
        const imgRes = await axios.get(thumbnail, { 
          responseType: "arraybuffer",
          timeout: 15000 
        });
        fs.writeFileSync(imgPath, imgRes.data);
        console.log("✅ Thumbnail downloaded");
      } catch (imgError) {
        console.error("❌ Thumbnail download error:", imgError.message);
      }
    }

    api.unsendMessage(waitingMsg.messageID);
    await api.sendMessage(`✅ Found: ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n📥 Downloading...`, threadID);

    // Download audio
    console.log("📥 Downloading audio...");
    const audioRes = await axios.get(audioUrl, { 
      responseType: "arraybuffer",
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'audio/mpeg,audio/*',
        'Referer': 'https://www.youtube.com/'
      }
    });
    
    fs.writeFileSync(audioPath, audioRes.data);
    console.log("✅ Audio downloaded");

    // Send the track
    if (fs.existsSync(imgPath)) {
      // Send image with details first
      api.sendMessage({
        body: `🎵 ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        // Then send the audio
        api.sendMessage({
          body: "🎧 Here's your music!",
          attachment: fs.createReadStream(audioPath)
        }, threadID, () => {
          // Cleanup files
          try {
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          } catch (e) {
            console.error("Cleanup error:", e);
          }
        });
      });
    } else {
      // Send only audio if no thumbnail
      api.sendMessage({
        body: `🎵 ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n\n🎧 Here's your music!`,
        attachment: fs.createReadStream(audioPath)
      }, threadID, () => {
        // Cleanup audio file
        try {
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      });
    }

  } catch (error) {
    api.unsendMessage(waitingMsg.messageID);
    console.error("❌ Music command error:", error.response?.data || error.message);
    
    let errorMessage = "❌ An error occurred while processing your request.";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "❌ API server is down. Please try again later.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "❌ Request timed out. Please try again.";
    } else if (error.response?.status === 404) {
      errorMessage = "❌ Song not found. Please try a different search term.";
    } else if (error.response?.data) {
      errorMessage = `❌ API Error: ${JSON.stringify(error.response.data)}`;
    }
    
    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
