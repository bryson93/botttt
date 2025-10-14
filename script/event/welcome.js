const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const GIFEncoder = require('gifencoder');

module.exports.config = {
    name: "welcome",
    version: "PRO-2.0.0",
    role: 0,
    description: "Enterprise-grade welcome system",
    credits: "bryson",
    hasEvent: true
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;
    const addedParticipants = event.logMessageData?.addedParticipants;
    if (!addedParticipants?.length) return;

    const groupInfo = await api.getThreadInfo(event.threadID);
    const groupName = groupInfo.threadName || "this group";
    const memberCount = groupInfo.participantIDs.length;

    const names = [];
    let userID;
    for (const participant of addedParticipants) {
        userID = participant.userFbId || participant.userId || participant.id;
        if (!userID) continue;

        const info = await api.getUserInfo(userID);
        names.push(info[userID]?.name || "New Member");
    }

    const botID = api.getCurrentUserID();
    const isBotAdded = addedParticipants.some(participant => 
        (participant.userFbId || participant.userId || participant.id) === botID
    );

    // Create welcome GIF
    if (!isBotAdded && userID) {
        try {
            const welcomeGif = await createWelcomeGIF(names[0], groupName, memberCount);
            await api.sendMessage({
                body: `🎉 Welcome ${names.join(", ")} to ${groupName}!`,
                attachment: welcomeGif
            }, event.threadID);
            return;
        } catch (error) {
            console.error("Error creating welcome GIF:", error);
        }
    }

    // Fallback to text message if GIF creation fails or for bot
    if (isBotAdded) {
        const botMessage = `
╔═══════════════════════════╗
        🤖 SYSTEM DEPLOYMENT
╚═══════════════════════════╝

🖥️  BOT: AUTOBOT PRO
📁 GROUP: ${groupName}
⚡ VERSION: 2.0.0
👨‍💻 DEVELOPER: Bryson
🔧 STATUS: OPERATIONAL

╔═══════════════════════════╗
        💬 Type 'help' for commands
╚═══════════════════════════╝
        `;
        await api.sendMessage({ body: botMessage }, event.threadID);
    } else {
        const welcomeMessage = `
╔═══════════════════════════╗
        🎯 MEMBER JOINED
╚═══════════════════════════╝

👤 USER: ${names.join(", ")}
🏠 GROUP: ${groupName}
📊 MEMBER COUNT: ${memberCount}
✅ STATUS: ACTIVE

╔═══════════════════════════╗
        🌟 Welcome aboard!
╚═══════════════════════════╝
        `;
        await api.sendMessage({ body: welcomeMessage }, event.threadID);
    }
};

async function createWelcomeGIF(userName, groupName, memberCount) {
    const width = 800;
    const height = 400;
    const encoder = new GIFEncoder(width, height);
    
    const filePath = path.join(__dirname, `welcome_${Date.now()}.gif`);
    const stream = fs.createWriteStream(filePath);
    
    encoder.createReadStream().pipe(stream);
    encoder.start();
    encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
    encoder.setDelay(100); // Frame delay in ms
    encoder.setQuality(10); // Image quality

    const frames = 30; // Number of frames for the animation

    for (let i = 0; i < frames; i++) {
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Animated gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const hue = (i * 10) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
        gradient.addColorStop(1, `hsl(${hue + 60}, 70%, 30%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Pulsating border
        ctx.strokeStyle = `hsl(${(i * 15) % 360}, 100%, 50%)`;
        ctx.lineWidth = 6 + Math.sin(i * 0.3) * 2;
        ctx.strokeRect(15, 15, width - 30, height - 30);

        // Floating particles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let j = 0; j < 20; j++) {
            const x = (Math.sin(i * 0.2 + j) * 100) + (width / 2);
            const y = (Math.cos(i * 0.2 + j) * 50) + (height / 2);
            const size = 2 + Math.sin(i * 0.1 + j) * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Title with fade-in effect
        const titleOpacity = Math.min(1, i / 10);
        ctx.fillStyle = `rgba(255, 255, 255, ${titleOpacity})`;
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎊 WELCOME 🎊', width / 2, 80);

        // User name with typing effect
        const displayName = userName.substring(0, Math.min(userName.length, i - 5));
        if (displayName.length > 0) {
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(displayName, width / 2, 160);
            
            // Blinking cursor effect
            if (i % 10 < 5) {
                const textWidth = ctx.measureText(displayName).width;
                ctx.fillRect(width / 2 + textWidth / 2 + 2, 145, 3, 25);
            }
        }

        // Group info slide-in
        const groupSlide = Math.max(0, (i - 10) * 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Group: ${groupName}`, width / 2, 220 + groupSlide * 0.1);

        // Member count with counting animation
        const animatedCount = Math.min(memberCount, Math.floor((i - 15) * (memberCount / 10)));
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Member #${animatedCount}`, width / 2, 270);

        // Pulsating welcome text
        const pulse = 1 + Math.sin(i * 0.2) * 0.2;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.font = 'bold 26px Arial';
        ctx.fillText('🌟 Welcome to the community! 🌟', width / 2, height - 50);

        // Add frame to GIF
        encoder.addFrame(ctx);
    }

    encoder.finish();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve(fs.createReadStream(filePath));
        });
        stream.on('error', reject);
    });
}
