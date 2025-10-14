module.exports.config = {
  name: "acc",
  version: "1.0.0",
  credits: "bryson",
  role: 2,
  hasPrefix: true,
  description: "Accept friend requests by number or all",
  usage: "{p}acc [number/all]",
  cooldown: 5
};

module.exports.run = async function({ api, event, args }) {
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } })
  };

  const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
  const parsed = JSON.parse(response);
  const listRequest = parsed.data?.viewer?.friending_possibilities?.edges || [];

  if (listRequest.length === 0) {
    return api.sendMessage("No friend requests pending.", event.threadID);
  }

  if (args[0] === "all") {
    const success = [];
    const failed = [];

    for (const user of listRequest) {
      try {
        const acceptForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
          doc_id: "3147613905362928",
          variables: JSON.stringify({
            input: {
              source: "friends_tab",
              actor_id: api.getCurrentUserID(),
              friend_requester_id: user.node.id,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3,
            refresh_num: 0
          })
        };

        const acceptResponse = await api.httpPost("https://www.facebook.com/api/graphql/", acceptForm);
        
        if (!JSON.parse(acceptResponse).errors) {
          success.push(user.node.name);
        } else {
          failed.push(user.node.name);
        }
      } catch (e) {
        failed.push(user.node.name);
      }
    }

    return api.sendMessage(
      `✅ Accepted all friend requests:\n\nSuccess: ${success.length}\n${success.join("\n")}${
        failed.length > 0 ? `\n\nFailed: ${failed.length}\n${failed.join("\n")}` : ""
      }`,
      event.threadID
    );
  }

  if (args[0]) {
    const numbers = args.map(num => parseInt(num)).filter(num => !isNaN(num) && num > 0 && num <= listRequest.length);
    
    if (numbers.length === 0) {
      return api.sendMessage("Invalid numbers provided.", event.threadID);
    }

    const success = [];
    const failed = [];

    for (const num of numbers) {
      const user = listRequest[num - 1];
      try {
        const acceptForm = {
          av: api.getCurrentUserID(),
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
          doc_id: "3147613905362928",
          variables: JSON.stringify({
            input: {
              source: "friends_tab",
              actor_id: api.getCurrentUserID(),
              friend_requester_id: user.node.id,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3,
            refresh_num: 0
          })
        };

        const acceptResponse = await api.httpPost("https://www.facebook.com/api/graphql/", acceptForm);
        
        if (!JSON.parse(acceptResponse).errors) {
          success.push(`${num}. ${user.node.name}`);
        } else {
          failed.push(`${num}. ${user.node.name}`);
        }
      } catch (e) {
        failed.push(`${num}. ${user.node.name}`);
      }
    }

    return api.sendMessage(
      `✅ Accepted friend requests:\n\n${success.join("\n")}${
        failed.length > 0 ? `\n\n❌ Failed:\n${failed.join("\n")}` : ""
      }`,
      event.threadID
    );
  }

  let msg = "📩 Friend Requests:\n\n";
  listRequest.forEach((user, index) => {
    msg += `${index + 1}. ${user.node.name}\n`;
  });

  msg += "\nUse: acc [number] or acc all";
  api.sendMessage(msg, event.threadID);
};
