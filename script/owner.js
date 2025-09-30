const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

module.exports.config = {
  name: "owner",
  version: "1.0.0",
  credits: "Ari A.K.A pogi",
  description: "Show info card about the owner",
  usage: "{p}owner",
  cooldown: 3
};

module.exports.run = async ({ api, event }) => {
  try {
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0f0c29");
    gradient.addColorStop(0.5, "#302b63");
    gradient.addColorStop(1, "#24243e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < width; i += 40) {
      for (let j = 0; j < height; j += 40) {
        ctx.fillRect(i, j, 2, 2);
      }
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(30, 30, width - 60, height - 60, 20);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const avatar = await loadImage("https://i.imgur.com/GSU0fOb.jpeg");
    ctx.save();
    
    const avatarGradient = ctx.createLinearGradient(80, 100, 280, 300);
    avatarGradient.addColorStop(0, "#00dbde");
    avatarGradient.addColorStop(1, "#fc00ff");
    ctx.lineWidth = 6;
    ctx.strokeStyle = avatarGradient;
    ctx.beginPath();
    ctx.arc(180, 200, 90, 0, Math.PI * 2, true);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(180, 200, 85, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 95, 115, 170, 170);
    ctx.restore();

    const robotEmoji = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f916.png");
    const computerEmoji = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4bb.png");
    const rocketEmoji = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f680.png");
    const globeEmoji = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f310.png");
    const lightningEmoji = await loadImage("https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26a1.png");

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px 'Segoe UI', Arial, sans-serif";
    ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText("BRYSON", 350, 160);
    ctx.shadowBlur = 0;

    ctx.drawImage(robotEmoji, 350, 175, 30, 30);
    ctx.fillStyle = "#00ffff";
    ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("AUTOBOT OWNER", 390, 200);
    ctx.drawImage(robotEmoji, 650, 175, 30, 30);

    ctx.drawImage(computerEmoji, 320, 225, 25, 25);
    ctx.fillStyle = "#e0e0e0";
    ctx.font = "24px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Full Stack Developer", 355, 250);

    ctx.drawImage(rocketEmoji, 320, 265, 25, 25);
    ctx.fillText("Bot Creator & Innovator", 355, 290);

    ctx.drawImage(globeEmoji, 320, 305, 25, 25);
    ctx.fillText("Always Online", 355, 330);

    ctx.drawImage(lightningEmoji, 320, 345, 25, 25);
    ctx.fillText("Daily Innovation", 355, 370);

    ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(350, 220);
    ctx.lineTo(650, 220);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Leading the future of automation", 350, 420);

    const path = __dirname + "/cache/owner_card.png";
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(path, buffer);

    api.sendMessage(
      {
        body: "👑 𝕺𝖜𝖓𝖊𝖗 𝕴𝖓𝖋𝖔𝖗𝖒𝖆𝖙𝖎𝖔𝖓 👑\n✦ Founder & Lead Developer\n✦ Full Stack Specialist\n✦ Innovation Driven",
        attachment: fs.createReadStream(path)
      },
      event.threadID,
      () => fs.unlinkSync(path),
      event.messageID
    );
  } catch (err) {
    api.sendMessage("❌ Error generating owner card: " + err.message, event.threadID, event.messageID);
  }
};
