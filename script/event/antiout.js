module.exports.config = {
  name: "antiout",
  version: "2.2.0"
};

module.exports.handleEvent = async ({ event, api }) => {
  if (event.logMessageData?.leftParticipantFbId === api.getCurrentUserID()) return;

  if (event.logMessageData?.leftParticipantFbId) {
    const info = await api.getUserInfo(event.logMessageData?.leftParticipantFbId);
    const { name } = info[event.logMessageData?.leftParticipantFbId];
    const mention = [{ tag: name, id: event.logMessageData?.leftParticipantFbId }];

    // 🔥 Taunting / funny / savage messages
    const taunts = [
      `🤣 HAAHAHA nice try @${name}!\n👉 Walang takas sayo dito.`,
      `😂 Uy @${name}, saan ka pupunta?\n😈 Balik ka rito kahit ayaw mo!`,
      `😏 @${name}, akala mo makakatakas ka?\n🚪 Exit button = Fake news.`,
      `👀 @${name}, wag ka nang tumakbo...\nNandito ka na habang buhay lol.`,
      `🤖 @${name}, kahit magdata off ka, babalik ka pa rin dito.`,

      // Savage
      `🔥 @${name}, kala mo mahal ka ng labas? 🤣\nWalang nagmamahal sayo dun, kaya balik ka na rito.`,
      `💀 @${name}, wag ka nang mag-drama…\nDi ka naman sikat para mag-exit. 😂`,
      `😈 @${name}, umalis ka pa, eh wala ka namang ambag lol.`,
      `😂 @${name}, akala mo free ka na? Hindi ka special pre, balik ka sa GC.`,
      `🤣 @${name}, kala ko ghosting lang ginagawa mo, pati GC iniwan mo rin? lol.`,

      // Wholesome / Banter
      `🥺 @${name}, wag ka nang umalis, miss ka agad ng GC 😢`,
      `❤️ @${name}, balik ka rito please, di buo ang tropa pag wala ka.`,
      `😇 @${name}, kahit anong gawin mo, pamilya ka pa rin namin dito.`,
      `🙃 @${name}, wag kang feeling prisoner, GC to hindi kulungan 🤣`,
      `✨ @${name}, you belong here… kahit ayaw mo pa 😌`
    ];

    // ❌ Error / fail messages
    const errors = [
      `🚫 Hindi ko maibalik si @${name} sa GC.\n⚠️ Mukhang naka-block ako 🥲`,
      `❌ @${name} rejected my love 💔\nDi ko siya maibalik 😢`,
      `🤔 @${name} blocked me. Okay fine, di kita pipilitin (pero masakit 🥹)`,
      `😤 @${name}, hayup ka! Naka-block ako kaya hindi kita maibalik.`,
      `😭 @${name}, ayaw na niya sa atin guys… blocked ako e.`
    ];

    api.addUserToGroup(event.logMessageData?.leftParticipantFbId, event.threadID, (error) => {
      if (error) {
        const errMsg = errors[Math.floor(Math.random() * errors.length)];
        api.sendMessage({ body: errMsg, mentions: mention }, event.threadID);
      } else {
        const taunt = taunts[Math.floor(Math.random() * taunts.length)];
        api.sendMessage({ body: taunt, mentions: mention }, event.threadID);
      }
    });
  }
};
