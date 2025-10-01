const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

module.exports.config = {
    name: "welcome",
    version: "5.0.0",
    role: 0,
    description: "Welcome new members",
    credits: "bryson",
    hasEvent: true
};

try {
    registerFont(path.join(__dirname, "fonts", "Poppins-Bold.ttf"), { family: "Poppins" });
    registerFont(path.join(__dirname, "fonts", "Poppins-Regular.ttf"), { family: "Poppins-Regular" });
} catch {}

// Twemoji URLs
const twemoji = {
    rocket: "https://twemoji.maxcdn.com/v/latest/72x72/1f680.png",
    wave: "https://twemoji.maxcdn.com/v/latest/72x72/1f44b.png",
    sparkles: "https://twemoji.maxcdn.com/v/latest/72x72/2728.png",
    party: "https://twemoji.maxcdn.com/v/latest/72x72/1f389.png",
    confetti: "https://twemoji.maxcdn.com/v/latest/72x72/1f38a.png",
    star: "https://twemoji.maxcdn.com/v/latest/72x72/2b50.png",
    fire: "https://twemoji.maxcdn.com/v/latest/72x72/1f525.png"
};

async function drawTwemoji(ctx, emojiKey, x, y, size = 36) {
    try {
        const emojiUrl = twemoji[emojiKey];
        if (!emojiUrl) return;
        
        const img = await loadImage(emojiUrl);
        ctx.drawImage(img, x, y, size, size);
    } catch (err) {
        console.log("⚠️ Twemoji failed to load:", emojiKey);
    }
}

function drawHolographicGrid(ctx, width, height) {
    // Main grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let j = 0; j < height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
    }

    // Diagonal accent lines
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.08)';
    for (let i = -height; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
    }
}

function drawFloatingParticles(ctx, width, height) {
    const particleColors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff80', '#ff0080'];
    
    for (let i = 0; i < 120; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4 + 1;
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        const opacity = Math.random() * 0.6 + 0.2;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawDataStream(ctx, width, height) {
    const chars = '01アイウエオカキクケコサシスセソ';
    ctx.font = "14px monospace";
    
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * width;
        const length = Math.floor(Math.random() * 8) + 3;
        let y = Math.random() * height;
        
        for (let j = 0; j < length; j++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const brightness = 1 - (j / length) * 0.8;
            
            ctx.fillStyle = `rgba(0, 255, ${Math.floor(200 * brightness)}, ${brightness})`;
            ctx.fillText(char, x, y);
            y += 16;
        }
    }
}

function drawHexagonPattern(ctx, width, height) {
    const hexSize = 40;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    for (let x = -hexSize; x < width + hexSize; x += hexSize * 1.5) {
        for (let y = -hexSize; y < height + hexSize; y += hexSize * Math.sqrt(3)) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hexX = x + hexSize * Math.cos(angle);
                const hexY = y + hexSize * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(hexX, hexY);
                } else {
                    ctx.lineTo(hexX, hexY);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
}

const genderAvatars = {
    male: "https://i.imgur.com/vA3Vkm7.png",
    female: "https://i.imgur.com/sbqWHV4.png"
};

async function getUserGender(api, userID) {
    try {
        const info = await api.getUserInfo(userID);
        const user = info[userID];
        if (!user || !user.gender) return Math.random() > 0.5 ? 'male' : 'female';
        const gender = user.gender;
        if (gender === 'male') return 'male';
        if (gender === 'female') return 'female';
        return Math.random() > 0.5 ? 'male' : 'female';
    } catch {
        return Math.random() > 0.5 ? 'male' : 'female';
    }
}

function createHexagonalClip(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hexX = x + size * Math.cos(angle);
        const hexY = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hexX, hexY);
        } else {
            ctx.lineTo(hexX, hexY);
        }
    }
    ctx.closePath();
    ctx.clip();
}

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    const addedParticipants = event.logMessageData?.addedParticipants;
    if (!addedParticipants?.length) return;

    const groupInfo = await api.getThreadInfo(event.threadID);
    const groupName = groupInfo.threadName || "this group";

    const width = 1000, height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(0.3, '#1a1a4a');
    gradient.addColorStop(0.7, '#2d1b69');
    gradient.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Background elements
    drawHexagonPattern(ctx, width, height);
    drawHolographicGrid(ctx, width, height);
    drawDataStream(ctx, width, height);
    drawFloatingParticles(ctx, width, height);

    // Main content area with glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.3)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.roundRect(50, 80, width - 100, height - 160, 20);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Header section with rocket emoji
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.textAlign = "center";
    ctx.font = "bold 42px Poppins";
    
    // Draw rocket emoji before text
    await drawTwemoji(ctx, 'rocket', width / 2 - 160, 110, 40);
    ctx.fillText("WELCOME ABOARD", width / 2, 150);
    ctx.shadowBlur = 0;

    // Avatar section
    const avatarSize = 70;
    const avatarSpacing = 30;
    const totalWidth = addedParticipants.length * (avatarSize * 2 + avatarSpacing) - avatarSpacing;
    let startX = width / 2 - totalWidth / 2;

    const names = [];
    for (const participant of addedParticipants) {
        const userID = participant.userFbId || participant.userId || participant.id;
        if (!userID) continue;

        const gender = await getUserGender(api, userID);
        const avatarURL = genderAvatars[gender];
        const avatarImg = await loadImage(avatarURL);

        // Hexagonal avatar
        ctx.save();
        createHexagonalClip(ctx, startX + avatarSize, 230, avatarSize);
        ctx.drawImage(avatarImg, startX, 230 - avatarSize, avatarSize * 2, avatarSize * 2);
        ctx.restore();

        // Neon hexagon border
        const borderColors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff80'];
        const borderColor = borderColors[Math.floor(Math.random() * borderColors.length)];
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hexX = startX + avatarSize + avatarSize * Math.cos(angle);
            const hexY = 230 + avatarSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hexX, hexY);
            } else {
                ctx.lineTo(hexX, hexY);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        startX += avatarSize * 2 + avatarSpacing;

        const info = await api.getUserInfo(userID);
        names.push(info[userID]?.name || "New Member");
    }

    // Welcome message with wave emoji
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.font = "bold 36px Poppins";
    
    await drawTwemoji(ctx, 'wave', width / 2 - 180, 295, 35);
    ctx.fillText(`HELLO, ${names.join(" & ")}`, width / 2, 330);
    ctx.shadowBlur = 0;

    // Group name with star emoji
    ctx.fillStyle = '#00ff80';
    ctx.font = "28px Poppins-Regular";
    
    await drawTwemoji(ctx, 'star', width / 2 - 200, 355, 30);
    ctx.fillText(`You've joined ${groupName}`, width / 2, 380);

    // Member count with fire emoji
    const memberCount = groupInfo.participantIDs.length;
    ctx.fillStyle = '#ffff00';
    ctx.font = "22px Poppins-Regular";
    
    await drawTwemoji(ctx, 'fire', width / 2 - 200, 395, 28);
    ctx.fillText(`We're now ${memberCount} strong members`, width / 2, 420);

    // Footer message with sparkles emojis
    ctx.fillStyle = '#88ffff';
    ctx.font = "20px Poppins-Regular";
    
    await drawTwemoji(ctx, 'sparkles', width / 2 - 240, 445, 25);
    await drawTwemoji(ctx, 'sparkles', width / 2 + 190, 445, 25);
    ctx.fillText("Feel free to introduce yourself and enjoy your stay", width / 2, 470);

    // Decorative elements
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, 490);
    ctx.lineTo(width / 2 - 50, 490);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width / 2 + 50, 490);
    ctx.lineTo(width / 2 + 150, 490);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imagePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
    fs.writeFileSync(imagePath, canvas.toBuffer("image/png"));

    await api.sendMessage({
        body: `🎉 Warm welcome to ${names.join(", ")}! The group now has ${memberCount} members. 🎊`,
        attachment: fs.createReadStream(imagePath)
    }, event.threadID);

    fs.unlinkSync(imagePath);
};
