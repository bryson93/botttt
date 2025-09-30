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
  prefix: true,
  credits: " bry",
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
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.shadowColor = "#6366f1";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawGlowingOrbs(ctx, width, height) {
  // Large glowing orbs in background
  const orbGradients = [
    { x: width * 0.1, y: height * 0.2, color1: "rgba(99, 102, 241, 0.15)", color2: "rgba(99, 102, 241, 0.05)", size: 120 },
    { x: width * 0.9, y: height * 0.7, color1: "rgba(236, 72, 153, 0.15)", color2: "rgba(236, 72, 153, 0.05)", size: 150 },
    { x: width * 0.8, y: height * 0.2, color1: "rgba(245, 158, 11, 0.1)", color2: "rgba(245, 158, 11, 0.05)", size: 100 }
  ];

  orbGradients.forEach(orb => {
    const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
    gradient.addColorStop(0, orb.color1);
    gradient.addColorStop(1, orb.color2);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

async function makeCoolCard(botPrefix, botName, ownerName) {
  const width = 800, height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Modern gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#0f172a");
  bgGradient.addColorStop(0.5, "#1e293b");
  bgGradient.addColorStop(1, "#334155");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  drawGlowingOrbs(ctx, width, height);
  drawParticles(ctx, width, height, 60);

  // Main content card with glass morphism effect
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.roundRect(50, 120, width - 100, 320, 30);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border effect
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(50, 120, width - 100, 320, 30);
  ctx.stroke();

  try {
    const avatar = await loadImage("https://i.imgur.com/lGxhMfB.png");
    const centerX = width / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, 100, 70, 0, Math.PI * 2);
    ctx.closePath();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 8;
    ctx.shadowColor = "#6366f1";
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(avatar, centerX - 70, 30, 140, 140);
    ctx.restore();
  } catch {}

  // Title with modern typography
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 38px OpenSans";
  ctx.textAlign = "center";
  ctx.fillText("BOT INFORMATION", width / 2, 190);

  // Information items with improved layout
  const items = [
    { emoji: emojiMap.pin, label: "Prefix", value: botPrefix, color: "#f59e0b", y: 240 },
    { emoji: emojiMap.id, label: "Bot Name", value: botName, color: "#10b981", y: 300 },
    { emoji: emojiMap.crown, label: "Owner", value: ownerName, color: "#ef4444", y: 360 }
  ];

  for (const item of items) {
    await drawEmoji(ctx, item.emoji, 100, item.y - 25, 32);
    
    // Label
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "26px OpenSans-Regular";
    ctx.textAlign = "left";
    ctx.fillText(item.label, 150, item.y);
    
    // Value with accent color
    ctx.fillStyle = item.color;
    ctx.font = "bold 28px OpenSans";
    ctx.fillText(item.value, 150, item.y + 35);
  }

  // Decorative line separator
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 270);
  ctx.lineTo(width - 100, 270);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(100, 330);
  ctx.lineTo(width - 100, 330);
  ctx.stroke();

  // Footer message with gradient text
  const footerGradient = ctx.createLinearGradient(200, 0, 600, 0);
  footerGradient.addColorStop(0, "#8b5cf6");
  footerGradient.addColorStop(0.3, "#06b6d4");
  footerGradient.addColorStop(0.6, "#10b981");
  footerGradient.addColorStop(1, "#f59e0b");

  ctx.fillStyle = footerGradient;
  ctx.font = "italic 24px OpenSans-Regular";
  ctx.textAlign = "center";
  ctx.fillText("Enjoy chatting with me! ✨", width / 2, 430);

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
