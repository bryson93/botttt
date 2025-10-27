const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: [],
  description: "Search and download Spotify track.",
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
  const searchURL = `https://arychauhann.onrender.com/api/spotifyplay?query=${keyword}`;

  await api.sendMessage("🎵 Searching for song...", threadID, messageID);

  try {
    const searchRes = await axios.get(searchURL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = searchRes.data;
    
    // Extract track information from the new API response
    const track = data.data || data.result || data;
    
    if (!track || !track.audio) {
      console.log("API Response:", JSON.stringify(data, null, 2));
      return api.sendMessage("❌ No Spotify track found or invalid API response.", threadID, messageID);
    }

    const title = track.title || track.name || "Unknown Title";
    const artist = track.artist || track.artists || track.singer || "Unknown Artist";
    const audioUrl = track.audio || track.url || track.downloadUrl || track.audioUrl;
    const thumbnail = track.thumbnail || track.cover || track.image || track.artwork;

    if (!audioUrl) {
      return api.sendMessage("❌ No audio URL found in the response.", threadID, messageID);
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
      } catch (imgError) {
        console.error("Thumbnail download error:", imgError);
      }
    }

    // Download audio
    const audioRes = await axios.get(audioUrl, { 
      responseType: "arraybuffer",
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    fs.writeFileSync(audioPath, audioRes.data);

    // Send the track
    if (fs.existsSync(imgPath)) {
      // Send image with details first
      api.sendMessage({
        body: `🎵 ${title}\n👤 ${artist}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        // Then send the audio
        api.sendMessage({
          body: "🎧 Here's your Spotify track!",
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
        body: `🎵 ${title}\n👤 ${artist}\n\n🎧 Here's your Spotify track!`,
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
    console.error("Spotify command error:", error.response?.data || error.message);
    
    let errorMessage = "❌ An error occurred while processing your request.";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "❌ API server is down. Please try again later.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "❌ Request timed out. Please try again.";
    } else if (error.response?.status === 404) {
      errorMessage = "❌ Song not found. Please try a different search term.";
    }
    
    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
