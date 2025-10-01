module.exports = async ({ api }) => {
  const logger = console.log;

  const configCustom = {
    autosetbio: {
      status: true,
      bio: `❐❒ AUTOBOT ❒❐
▣ site owner : bryson
▣ autobot site: https://automated-chatbot-61a3.onrender.com/`
    },
    greetings: {
      status: true,
      schedule: [
        { start: { h: 5, m: 0 }, message: "🌅 Good morning! A new day begins - rise and shine with purpose! ☀️" },
        { start: { h: 6, m: 0 }, message: "🧘‍♂️ Time for morning stretches! Let's awaken those muscles and minds!" },
        { start: { h: 7, m: 0 }, message: "🍳 Breakfast time! Fuel your body for the day ahead. Don't skip the most important meal! 🥐☕" },
        { start: { h: 9, m: 0 }, message: "🚀 Productivity mode activated! Let's make today amazing! What's your main goal for today? 💼✨" },
        { start: { h: 11, m: 0 }, message: "🌤️ Late morning check-in! Almost lunch time - stay hydrated and keep pushing! 💧" },
        { start: { h: 12, m: 0 }, message: "🍲 Lunch break! Time to refuel and recharge. Remember: food is self-care! 🥗❤️" },
        { start: { h: 14, m: 0 }, message: "🌞 Afternoon energy! How's your day going? Take a quick stretch if you've been sitting! 🪑" },
        { start: { h: 15, m: 0 }, message: "☕ Snack attack! Time for a quick energy boost. What's your go-to snack? 🍎🍫" },
        { start: { h: 17, m: 0 }, message: "🌆 Evening approaches! Take a deep breath and acknowledge your achievements today 🌬️" },
        { start: { h: 18, m: 0 }, message: "🌇 Good evening! Time to unwind and transition to relaxation mode 🛋️" },
        { start: { h: 19, m: 0 }, message: "🍛 Dinner time! Nourish your body with a good meal. You've earned it! 🍽️✨" },
        { start: { h: 21, m: 0 }, message: "🌙 Night vibes settling in! Perfect time for some quiet reflection or reading 📖" },
        { start: { h: 22, m: 0 }, message: "🕙 10:00 PM - Remember your worth! You're stronger than any temporary struggle. 💪💖" },
        { start: { h: 0, m: 0 }, message: "🕛 Midnight! A new day begins. Rest well and dream big! 🌠" },
        { start: { h: 2, m: 0 }, message: "🦉 Late night owl hours! If you're still up, remember to prioritize your sleep soon 😴" },
        { start: { h: 4, m: 0 }, message: "🌄 Almost sunrise! The early birds are waking up to a brand new opportunity! 🌅" }
      ],
      specialDays: {
        weekend: {
          message: "🎉 Weekend mode activated! Time to relax, recharge, and do what makes you happy! 🏖️✨",
          time: { h: 9, m: 0 }
        },
        monday: {
          message: "💪 Monday motivation! New week, fresh start. You've got this! Let's make it count! 🚀",
          time: { h: 8, m: 0 }
        },
        friday: {
          message: "🎊 Friday celebration! You made it through the week! Time to enjoy some well-deserved rest! 🥳",
          time: { h: 18, m: 0 }
        }
      },
      randomMessages: [
        "✨ Remember to smile today - it looks good on you!",
        "💧 Hydration check! Have you had enough water today?",
        "🌱 Small progress is still progress! Keep going!",
        "❤️ You matter. Your feelings are valid. Your presence makes a difference.",
        "🎯 What's one small thing you can do today to make yourself proud?"
      ]
    },
    acceptPending: { 
      status: false, 
      time: 10,
      welcomeMessage: "👋 Welcome! This thread was automatically approved by our system. How can I help you today?"
    },
    keepAlive: { 
      status: true, 
      interval: 1000 * 60 * 10 
    }
  };

  // Auto-set bio function
  function autosetbio(config) {
    if (!config.status) return;
    try {
      api.changeBio(config.bio, (err) => {
        if (err) logger(`[setbio] Error: ${err}`);
        else logger(`[setbio] Changed bot bio to: ${config.bio}`);
      });
    } catch (error) {
      logger(`[setbio] Unexpected error: ${error}`);
    }
  }
  
  // Enhanced greetings function
  async function greetings(config) {
    if (!config.status) return;

    let sentToday = new Set();
    let currentDate = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
    let lastRandomMessageDate = null;

    setInterval(async () => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      const hour = now.getHours();
      const minute = now.getMinutes();
      const today = now.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
      const weekday = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Manila" });

      logger(`[timecheck] Now: ${hour}:${minute}, Date: ${today}, Day: ${weekday}`);

      // Reset daily tracking
      if (today !== currentDate) {
        sentToday.clear();
        currentDate = today;
      }

      const nowTotal = hour * 60 + minute;

      // Scheduled messages
      const scheduledMatch = config.schedule.find(s => {
        const startTotal = s.start.h * 60 + s.start.m;
        return nowTotal >= startTotal && nowTotal < startTotal + 2; // 2-minute window
      });

      if (scheduledMatch && !sentToday.has(`scheduled-${scheduledMatch.start.h}-${scheduledMatch.start.m}`)) {
        await sendToAllGroups(scheduledMatch.message, `scheduled-${scheduledMatch.start.h}-${scheduledMatch.start.m}`);
      }

      // Special day messages
      const specialDayKey = getSpecialDay(weekday);
      if (specialDayKey) {
        const specialDay = config.specialDays[specialDayKey];
        if (nowTotal === specialDay.time.h * 60 + specialDay.time.m && 
            !sentToday.has(`special-${specialDayKey}`)) {
          await sendToAllGroups(specialDay.message, `special-${specialDayKey}`);
        }
      }

      // Random motivational messages (once per day around 2 PM)
      if (hour === 14 && minute === 0 && today !== lastRandomMessageDate) {
        const randomMessage = config.randomMessages[
          Math.floor(Math.random() * config.randomMessages.length)
        ];
        await sendToAllGroups(randomMessage, `random-${today}`);
        lastRandomMessageDate = today;
      }

    }, 1000 * 60); // Check every minute

    async function sendToAllGroups(message, messageId) {
      try {
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        const groupThreads = threads.filter(t => t.isGroup);
        
        for (const thread of groupThreads) {
          try {
            await api.sendMessage(message, thread.threadID);
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            logger(`[greetings] Error sending to thread ${thread.threadID}:`, err);
          }
        }
        
        logger(`[greetings] Sent to ${groupThreads.length} groups: ${message}`);
        sentToday.add(messageId);
      } catch (err) {
        logger("[greetings] Error getting thread list:", err);
      }
    }

    function getSpecialDay(weekday) {
      if (weekday === "Saturday" || weekday === "Sunday") return "weekend";
      if (weekday === "Monday") return "monday";
      if (weekday === "Friday") return "friday";
      return null;
    }
  }

  // Accept pending requests
  function acceptPending(config) {
    if (!config.status) return;
    setInterval(async () => {
      try {
        const list = [
          ...(await api.getThreadList(1, null, ["PENDING"])),
          ...(await api.getThreadList(1, null, ["OTHER"]))
        ];
        if (list[0]) {
          api.sendMessage(config.welcomeMessage, list[0].threadID);
          logger(`[pending] Approved thread: ${list[0].threadID}`);
        }
      } catch (err) {
        logger(`[pending] Error: ${err}`);
      }
    }, config.time * 60 * 1000);
  }

  // Keep session alive
  function keepAlive(config) {
    if (!config.status) return;
    setInterval(async () => {
      try {
        await api.getCurrentUserID();
        logger("[keepAlive] Session refreshed.");
      } catch (err) {
        logger("[keepAlive] Error refreshing session:", err);
      }
    }, config.interval);
  }

  // Initialize all systems
  autosetbio(configCustom.autosetbio);
  greetings(configCustom.greetings);
  acceptPending(configCustom.acceptPending);
  keepAlive(configCustom.keepAlive);

  logger("[SYSTEM] 🤖 Enhanced autosystem is running smoothly...");
};
