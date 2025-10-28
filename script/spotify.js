const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "spotify",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  aliases: ["music", "song"],
  description: "Search and download music using Spotify info and YouTube audio.",
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
  
  // First API: Get track info from Spotify
  const spotifyAPI = `https://api.nekolabs.web.id/downloader/spotify/play/v1?q=${keyword}`;
  // Second API: Download audio from YouTube
  const youtubeAPI = `https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${keyword}`;

  const waitingMsg = await api.sendMessage("🎵 Searching for music...", threadID);

  try {
    console.log(`🔍 Getting track info from: ${spotifyAPI}`);
    
    // Step 1: Get track information from Spotify API
    const spotifyRes = await axios.get(spotifyAPI, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const spotifyData = spotifyRes.data;
    console.log("📦 Spotify API Response:", JSON.stringify(spotifyData, null, 2));

    if (!spotifyData) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from Spotify API.", threadID, messageID);
    }

    // Extract track information from Spotify API
    let trackInfo = spotifyData.data || spotifyData.result || spotifyData;
    
    if (!trackInfo) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ No music found on Spotify.", threadID, messageID);
    }

    // Extract information from Spotify response
    const title = trackInfo.title || trackInfo.name || "Unknown Title";
    const artist = trackInfo.artist || trackInfo.artists || trackInfo.singer || "Unknown Artist";
    const duration = trackInfo.duration || trackInfo.length || "";
    const thumbnail = trackInfo.thumbnail || trackInfo.cover || trackInfo.image;

    console.log(`🎵 Spotify Found: ${title} by ${artist}`);
    console.log(`⏱️ Duration: ${duration}`);

    // Step 2: Get audio from YouTube API
    console.log(`🔍 Getting audio from: ${youtubeAPI}`);
    
    const youtubeRes = await axios.get(youtubeAPI, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const youtubeData = youtubeRes.data;
    console.log("📦 YouTube API Response:", JSON.stringify(youtubeData, null, 2));

    if (!youtubeData) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from YouTube API.", threadID, messageID);
    }

    // Extract audio URL from YouTube API
    let youtubeTrack = youtubeData.data || youtubeData.result || youtubeData;
    let audioUrl = null;

    if (youtubeTrack) {
      // Try to get audio URL from YouTube response
      audioUrl = youtubeTrack.audio || youtubeTrack.url || youtubeTrack.downloadUrl || 
                 youtubeTrack.audioUrl || youtubeTrack.download_link || youtubeTrack.link;

      // If no direct audio URL, check for formats array (common in YouTube APIs)
      if (!audioUrl && youtubeTrack.formats && Array.isArray(youtubeTrack.formats)) {
        // Prefer audio-only formats or high quality audio
        const audioFormat = youtubeTrack.formats.find(format => 
          (format.mimeType && format.mimeType.includes('audio')) ||
          format.quality === 'audio' ||
          (format.hasAudio && !format.hasVideo)
        );
        audioUrl = audioFormat?.url;
        
        // If still no audio URL, take the first format
        if (!audioUrl && youtubeTrack.formats.length > 0) {
          audioUrl = youtubeTrack.formats[0].url;
        }
      }
    }

    console.log(`🔗 YouTube Audio URL: ${audioUrl}`);

    if (!audioUrl) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ No audio URL found from YouTube.", threadID, messageID);
    }

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail from Spotify if available
    if (thumbnail) {
      try {
        const imgRes = await axios.get(thumbnail, { 
          responseType: "arraybuffer",
          timeout: 15000 
        });
        fs.writeFileSync(imgPath, imgRes.data);
        console.log("✅ Thumbnail downloaded from Spotify");
      } catch (imgError) {
        console.error("❌ Thumbnail download error:", imgError.message);
      }
    }

    api.unsendMessage(waitingMsg.messageID);
    await api.sendMessage(`✅ Found: ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n📥 Downloading audio...`, threadID);

    // Download audio from YouTube
    console.log("📥 Downloading audio from YouTube...");
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
    console.log("✅ Audio downloaded from YouTube");

    // Send the track
    const messageBody = `🎵 ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n\n🎧 Here's your music!`;

    if (fs.existsSync(imgPath)) {
      // Send image with details first
      api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        // Then send the audio
        api.sendMessage({
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
        body: messageBody,
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
      errorMessage = `❌ API Error: ${error.response.data.message || JSON.stringify(error.response.data)}`;
    }
    
    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
