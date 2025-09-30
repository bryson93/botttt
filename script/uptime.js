const os = require("os");

const startTime = new Date();

module.exports.config = {
  name: "uptime",
  aliases: ["up"],
  author: "Ari",
  role: 0,
  description: "Get system uptime and status",
  usage: "uptime",
  category: "system"
};

module.exports.run = async function ({ api, event, args, usersData, threadsData }) {
  try {
    const uptimeInSeconds = (new Date() - startTime) / 1000;

    const days = Math.floor(uptimeInSeconds / (3600 * 24));
    const hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const secondsLeft = Math.floor(uptimeInSeconds % 60);
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;

    const cpuUsage =
      os
        .cpus()
        .map((cpu) => cpu.times.user)
        .reduce((acc, curr) => acc + curr) / os.cpus().length;

    const totalMemoryGB = os.totalmem() / 1024 ** 3;
    const freeMemoryGB = os.freemem() / 1024 ** 3;
    const usedMemoryGB = totalMemoryGB - freeMemoryGB;

    let allUsers = [];
    let allThreads = [];
    if (usersData && usersData.getAll) {
      allUsers = await usersData.getAll();
    }
    if (threadsData && threadsData.getAll) {
      allThreads = await threadsData.getAll();
    }

    const currentDate = new Date();
    const date = currentDate.toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila"
    });
    const time = currentDate.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour12: true,
    });

    const pingStart = Date.now();
    await api.sendMessage("🔎 Checking system...", event.threadID, event.messageID);
    const ping = Date.now() - pingStart;

    let pingStatus = "⛔ Bad System";
    if (ping < 1000) pingStatus = "✅ Smooth System";

    const systemInfo = `♡   ∩_∩
 （„• ֊ •„)♡
╭─∪∪────────────⟡
│ 𝗨𝗣𝗧𝗜𝗠𝗘 𝗜𝗡𝗙𝗢
├───────────────⟡
│ ⏰ Runtime: ${uptimeFormatted}
├───────────────⟡
│ 👑 System Info
│ OS: ${os.type()} ${os.arch()}
│ Node: ${process.version}
│ CPU: ${os.cpus()[0].model}
│ Storage: ${usedMemoryGB.toFixed(2)} GB / ${totalMemoryGB.toFixed(2)} GB
│ CPU Usage: ${cpuUsage.toFixed(1)}%
│ RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
├───────────────⟡
│ ✅ Other Info
│ Date: ${date}
│ Time: ${time}
│ Users: ${allUsers.length || 0}
│ Threads: ${allThreads.length || 0}
│ Ping: ${ping}ms
│ Status: ${pingStatus}
╰───────────────⟡`;

    api.sendMessage(systemInfo, event.threadID, event.messageID);

  } catch (error) {
    console.error("Error:", error);
    api.sendMessage("❌ Unable to retrieve system information.", event.threadID, event.messageID);
  }
};
