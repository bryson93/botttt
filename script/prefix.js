const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

try {
  registerFont(path.join(__dirname, "../fonts/OpenSans-Bold.ttf"), { family: "OpenSans" });
  registerFont(path.join(__dirname, "../fonts/OpenSans-Regular.ttf"), { family: "OpenSans-Regular" });
} catch (e) {
  console.log("⚠️ Font not found, using system default.");
}

let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json")));
} catch (e) {
  config.prefix = "[ no set ]";
  config.botName = "Bryson Bot";
  config.ownerName = "Bryson"; 
}

module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  role: 0,
  description: "bot prefix",
  prefix: false,
  credits: "bry",
  cooldowns: 5,
  category: "info"
};

const emojiMap = {
  bot: "https://twemoji.maxcdn.com/v/latest/72x72/1f916.png",
  pin: "https://twemoji.maxcdn.com/v/latest/72x72/1f4cc.png",
  id: "https://twemoji.maxcdn.com/v/latest/72x72/1f194.png",
  crown: "https://twemoji.maxcdn.com/v/latest/72x72/1f451.png"
};

async function drawEmoji(ctx, url, x, y, size = 36) {
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, x, y, size, size);
  } catch (err) {
    console.log("⚠️ Emoji failed:", url);
  }
}

function drawParticles(ctx, width, height, count = 40) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 3 + 1;
    const opacity = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

async function makeCoolCard(botPrefix, botName, ownerName) {
  const width = 750, height = 460;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Cyberpunk gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0f0f23");
  bgGradient.addColorStop(0.3, "#1a1a2e");
  bgGradient.addColorStop(0.7, "#16213e");
  bgGradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  drawParticles(ctx, width, height, 50);

  ctx.fillStyle = "rgba(0, 255, 255, 0.05)";
  ctx.shadowColor = "rgba(0, 255, 255, 0.3)";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(40, 110, width - 80, 310, 25);
  ctx.fill();
  ctx.shadowBlur = 0;

  try {
    const avatar = await loadImage("https://i.imgur.com/lGxhMfB.png");
    const centerX = width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, 95, 60, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(avatar, centerX - 60, 35, 120, 120);
    ctx.restore();
  } catch {}

  // Title: "bot information:" (lowercase with colon)
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 36px OpenSans";
  ctx.textAlign = "center";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 10;
  ctx.fillText("bot information:", width / 2, 170);
  ctx.shadowBlur = 0;

  // Information items in the exact format from the image
  const infoItems = [
    { label: "prefix:", value: botPrefix, y: 220 },
    { label: "name:", value: botName, y: 270 },
    { label: "owner:", value: ownerName, y: 320 }
  ];

  ctx.textAlign = "left";
  
  infoItems.forEach(item => {
    // Labels in regular font
    ctx.fillStyle = "#88ffff";
    ctx.font = "28px OpenSans-Regular";
    ctx.fillText(item.label, 120, item.y);
    
    // Values in bold font
    ctx.fillStyle = "#ffff00";
    ctx.font = "bold 28px OpenSans";
    ctx.fillText(item.value, 220, item.y);
  });

  // Footer message with asterisks
  ctx.fillStyle = "#ff00ff";
  ctx.font = "italic 22px OpenSans-Regular";
  ctx.textAlign = "center";
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 8;
  ctx.fillText("*Enjoy chatting with me!*", width / 2, 390);
  ctx.shadowBlur = 0;

  return canvas.toBuffer();
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const botPrefix = config.prefix || "[ no set ]";
  const botName = config.botName || "Bryson Bot";
  const ownerName = config.ownerName || "Bryson";

  const imgBuffer = await makeCoolCard(botPrefix, botName, ownerName);
  const filePath = path.join(__dirname, `prefix_${Date.now()}.png`);
  fs.writeFileSync(filePath, imgBuffer);

  return api.sendMessage(
    { body: "", attachment: fs.createReadStream(filePath) },
    threadID,
    () => fs.unlinkSync(filePath),
    messageID
  );
};
