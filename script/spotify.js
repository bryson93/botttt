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
    console.log("📦 Full API Response:", JSON.stringify(data, null, 2));

    // Check if response has data
    if (!data) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from API.", threadID, messageID);
    }

    // Extract information - try different response structures
    let title = "Unknown Title";
    let artist = "Unknown Artist";
    let duration = "";
    let thumbnail = null;
    let audioUrl = null;

    // Method 1: Direct response structure
    if (data.title) title = data.title;
    if (data.author) artist = data.author;
    if (data.channel) artist = data.channel;
    if (data.duration) duration = data.duration;
    if (data.thumbnail) thumbnail = data.thumbnail;
    if (data.url) audioUrl = data.url;

    // Method 2: Nested data structure
    if (data.data) {
      const trackData = data.data;
      if (trackData.title) title = trackData.title;
      if (trackData.author) artist = trackData.author;
      if (trackData.channel) artist = trackData.channel;
      if (trackData.duration) duration = trackData.duration;
      if (trackData.thumbnail) thumbnail = trackData.thumbnail;
      if (trackData.url) audioUrl = trackData.url;
    }

    // Method 3: Result structure
    if (data.result) {
      const resultData = data.result;
      if (resultData.title) title = resultData.title;
      if (resultData.author) artist = resultData.author;
      if (resultData.channel) artist = resultData.channel;
      if (resultData.duration) duration = resultData.duration;
      if (resultData.thumbnail) thumbnail = resultData.thumbnail;
      if (resultData.url) audioUrl = resultData.url;
    }

    // Method 4: Check for video info
    if (data.video) {
      const videoData = data.video;
      if (videoData.title) title = videoData.title;
      if (videoData.author) artist = videoData.author;
      if (videoData.channel) artist = videoData.channel;
      if (videoData.duration) duration = videoData.duration;
      if (videoData.thumbnail) thumbnail = videoData.thumbnail;
      if (videoData.url) audioUrl = videoData.url;
    }

    // Method 5: Deep search for audio URL
    if (!audioUrl) {
      const findAudioUrl = (obj) => {
        if (typeof obj === 'string' && (obj.includes('.mp3') || obj.includes('googlevideo.com'))) {
          return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (let key in obj) {
            if (key.toLowerCase().includes('url') || key.toLowerCase().includes('audio') || key.toLowerCase().includes('download')) {
              if (typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                return obj[key];
              }
            }
            if (typeof obj[key] === 'object') {
              const result = findAudioUrl(obj[key]);
              if (result) return result;
            }
          }
        }
        return null;
      };
      
      audioUrl = findAudioUrl(data);
    }

    console.log(`🎵 Extracted Info:`);
    console.log(`   Title: ${title}`);
    console.log(`   Artist: ${artist}`);
    console.log(`   Duration: ${duration}`);
    console.log(`   Thumbnail: ${thumbnail}`);
    console.log(`   Audio URL: ${audioUrl}`);

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
    const messageBody = `🎵 ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n\n🎧 Here's your music!`;

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
      // Send only audio
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
      errorMessage = `❌ API Error: ${JSON.stringify(error.response.data)}`;
    }
    
    return api.sendMessage(errorMessage, threadID, messageID);
  }
};
