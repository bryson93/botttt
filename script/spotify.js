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
    console.log(`🔍 Step 1: Getting track info from Spotify API: ${spotifyAPI}`);
    
    // Step 1: Get track information from Spotify API
    const spotifyRes = await axios.get(spotifyAPI, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const spotifyData = spotifyRes.data;
    console.log("📦 RAW Spotify API Response:", spotifyData);

    if (!spotifyData) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from Spotify API.", threadID, messageID);
    }

    // Debug: Show all keys in the response
    console.log("🔑 All keys in Spotify response:", Object.keys(spotifyData));

    let trackInfo = spotifyData;
    let title = "Unknown Title";
    let artist = "Unknown Artist";
    let duration = "";
    let thumbnail = null;

    // Try different response structures
    if (spotifyData.data) {
      trackInfo = spotifyData.data;
      console.log("📊 Using 'data' object:", trackInfo);
    } else if (spotifyData.result) {
      trackInfo = spotifyData.result;
      console.log("📊 Using 'result' object:", trackInfo);
    } else if (Array.isArray(spotifyData) && spotifyData.length > 0) {
      trackInfo = spotifyData[0];
      console.log("📊 Using first array element:", trackInfo);
    }

    // Extract title from various possible fields
    if (trackInfo.title) title = trackInfo.title;
    else if (trackInfo.name) title = trackInfo.name;
    else if (trackInfo.song) title = trackInfo.song;
    else if (trackInfo.track) title = trackInfo.track;
    else if (trackInfo.videoTitle) title = trackInfo.videoTitle;

    // Extract artist from various possible fields
    if (trackInfo.artist) artist = trackInfo.artist;
    else if (trackInfo.artists) artist = trackInfo.artists;
    else if (trackInfo.singer) artist = trackInfo.singer;
    else if (trackInfo.author) artist = trackInfo.author;
    else if (trackInfo.channel) artist = trackInfo.channel;
    else if (trackInfo.uploader) artist = trackInfo.uploader;
    else if (trackInfo.creator) artist = trackInfo.creator;

    // Extract duration
    if (trackInfo.duration) duration = trackInfo.duration;
    else if (trackInfo.length) duration = trackInfo.length;
    else if (trackInfo.duration_formatted) duration = trackInfo.duration_formatted;

    // Extract thumbnail
    if (trackInfo.thumbnail) thumbnail = trackInfo.thumbnail;
    else if (trackInfo.thumb) thumbnail = trackInfo.thumb;
    else if (trackInfo.cover) thumbnail = trackInfo.cover;
    else if (trackInfo.image) thumbnail = trackInfo.image;
    else if (trackInfo.artwork) thumbnail = trackInfo.artwork;
    else if (trackInfo.poster) thumbnail = trackInfo.poster;

    console.log(`🎵 Extracted Info:
    Title: ${title}
    Artist: ${artist}
    Duration: ${duration}
    Thumbnail: ${thumbnail}`);

    // If we still have unknown values, try to search the response more deeply
    if (title === "Unknown Title" || artist === "Unknown Artist") {
      console.log("🔍 Deep searching response for track info...");
      
      // Convert entire response to string and search for patterns
      const responseString = JSON.stringify(spotifyData).toLowerCase();
      
      // Look for title-like patterns
      if (responseString.includes('title') && !title) {
        const titleMatch = /"title"\s*:\s*"([^"]+)"/i.exec(JSON.stringify(spotifyData));
        if (titleMatch) title = titleMatch[1];
      }
      
      // Look for artist-like patterns
      if (responseString.includes('artist') && !artist) {
        const artistMatch = /"artist"\s*:\s*"([^"]+)"/i.exec(JSON.stringify(spotifyData));
        if (artistMatch) artist = artistMatch[1];
      }
    }

    console.log(`🎵 Final Info:
    Title: ${title}
    Artist: ${artist}
    Duration: ${duration}`);

    // Step 2: Get audio from YouTube API
    console.log(`🔍 Step 2: Getting audio from YouTube API: ${youtubeAPI}`);
    
    const youtubeRes = await axios.get(youtubeAPI, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const youtubeData = youtubeRes.data;
    console.log("📦 YouTube API Response Structure:", Object.keys(youtubeData));

    if (!youtubeData) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ Empty response from YouTube API.", threadID, messageID);
    }

    // Extract audio URL from YouTube API
    let youtubeTrack = youtubeData.data || youtubeData.result || youtubeData;
    let audioUrl = null;

    if (youtubeTrack) {
      console.log("📊 YouTube track object:", youtubeTrack);
      
      // Try to get audio URL from YouTube response
      audioUrl = youtubeTrack.audio || youtubeTrack.url || youtubeTrack.downloadUrl || 
                 youtubeTrack.audioUrl || youtubeTrack.download_link || youtubeTrack.link;

      // If no direct audio URL, check for formats array
      if (!audioUrl && youtubeTrack.formats && Array.isArray(youtubeTrack.formats)) {
        console.log("🔍 Searching through formats array...");
        // Prefer audio-only formats
        const audioFormat = youtubeTrack.formats.find(format => 
          (format.mimeType && format.mimeType.includes('audio')) ||
          format.quality === 'audio' ||
          (format.hasAudio && !format.hasVideo)
        );
        audioUrl = audioFormat?.url;
        
        // If still no audio URL, take the first format with audio
        if (!audioUrl) {
          const firstAudio = youtubeTrack.formats.find(f => f.url);
          audioUrl = firstAudio?.url;
        }
      }
    }

    console.log(`🔗 Final YouTube Audio URL: ${audioUrl}`);

    if (!audioUrl) {
      api.unsendMessage(waitingMsg.messageID);
      return api.sendMessage("❌ No audio URL found from YouTube.", threadID, messageID);
    }

    const imgPath = path.join(__dirname, "cache", `thumb_${senderID}.jpg`);
    const audioPath = path.join(__dirname, "cache", `audio_${senderID}.mp3`);

    // Download thumbnail from Spotify if available
    if (thumbnail) {
      try {
        console.log(`🖼️ Downloading thumbnail: ${thumbnail}`);
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
    console.log("✅ Audio downloaded successfully");

    // Send the track
    const messageBody = `🎵 ${title}\n👤 ${artist}${duration ? `\n⏱️ ${duration}` : ''}\n\n🎧 Here's your music!`;

    if (fs.existsSync(imgPath)) {
      // Send image with details
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
