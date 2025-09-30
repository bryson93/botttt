module.exports.config = {
        name: 'help',
        version: '1.0.1',
        role: 0,
        hasPrefix: false,
        aliases: ['help', 'commands', 'menu'],
        description: "Beginner's guide and command list",
        usage: "Help [page] or [command]",
        credits: 'ARI',
};

module.exports.run = async function ({
        api,
        event,
        enableCommands,
        args,
        Utils,
        prefix
}) {
        const input = args[0];
        try {
                const eventCommands = enableCommands[1].handleEvent;
                const commands = enableCommands[0].commands;

                const perPage = 10;
                const totalPages = Math.ceil(commands.length / perPage);
                const page = !isNaN(input) ? Math.max(1, Math.min(parseInt(input), totalPages)) : 1;
                const start = (page - 1) * perPage;
                const end = start + perPage;

                if (!input || !isNaN(input)) {
                        let helpMessage = `╔═══════════════════════╗\n`;
                        helpMessage += `     ✦ BOT HELP MENU ✦          \n`;
                        helpMessage += `╚═══════════════════════╝\n\n`;
                        
                        helpMessage += `◈ Command List (Page ${page}/${totalPages})\n`;
                        helpMessage += `┌───────────────────────┐\n`;

                        for (let i = start; i < Math.min(end, commands.length); i++) {
                                helpMessage += `│╭ ➤ ${i + 1}. ${prefix}${commands[i]}\n`;
                                helpMessage += `│╰───────────────          \n`;
                        }
                        
                        helpMessage += `└───────────────────────┘\n\n`;

                        helpMessage += `⌕ Navigation:\n`;
                        helpMessage += `• Type ${prefix}help [page] - View other pages\n`;
                        helpMessage += `• Type ${prefix}help [command] - Command details\n`;
                        helpMessage += `• Total Commands: ${commands.length}\n\n`;

                        if (page === 1 && eventCommands.length) {
                                helpMessage += `❍ Event Commands:\n`;
                                helpMessage += `┌───────────────────────┐\n`;
                                eventCommands.forEach((eventCommand, index) => {
                                        helpMessage += `│╭ ❐ E${index + 1}. ${prefix}${eventCommand}\n`;
                                        helpMessage += `│╰───────────────         \n`;
                                });
                                helpMessage += `└───────────────────────┘\n\n`;
                        }

                        helpMessage += `◎ Tip: Use "${prefix}help commandname" for detailed info!`;

                        return api.sendMessage(helpMessage, event.threadID, event.messageID);
                } else {
                        const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) =>
                                key.includes(input?.toLowerCase())
                        )?.[1];

                        if (command) {
                                const {
                                        name,
                                        version,
                                        role,
                                        aliases = [],
                                        description,
                                        usage,
                                        credits,
                                        cooldown,
                                        hasPrefix
                                } = command;

                                const roleMessage = role !== undefined
                                        ? (role === 0
                                                ? '◌ User'
                                                : role === 1
                                                        ? '◉ Admin'
                                                        : role === 2
                                                                ? '◎ Thread Admin'
                                                                : role === 3
                                                                        ? '✦ Super Admin'
                                                                        : '❓ Unknown')
                                        : '❓ Unknown';

                                const aliasesMessage = aliases.length ? `• ${aliases.join(', ')}` : 'None';
                                const descriptionMessage = description || 'No description available';
                                const usageMessage = usage ? `${prefix}${usage}` : `${prefix}${name}`;
                                const creditsMessage = credits || 'Unknown';
                                const versionMessage = version || '1.0.0';
                                const cooldownMessage = cooldown ? `${cooldown} seconds` : 'No cooldown';

                                const message = `
╔═══════════════════════╗
     ❖ COMMAND INFO    
╚═══════════════════════╝

╭ ➤ Name: ${name}
│╭ ◈ Version: ${versionMessage}
│╰───────────────
╭ ➤ Permission: ${roleMessage}
│╭ ⌚ Cooldown: ${cooldownMessage}
│╰───────────────
╭ ❏ Description:
│   ${descriptionMessage}
│╰───────────────
╭ ◑ Aliases:
│   ${aliasesMessage}
│╰───────────────
╭ ◎ Usage:
│   ${usageMessage}
│╰───────────────
╭ ✎ Credits: ${creditsMessage}
╰───────────────

◎ Use "${prefix}help" to see all commands
                                `.trim();

                                return api.sendMessage(message, event.threadID, event.messageID);
                        } else {
                                const errorMessage = `
✗ Command Not Found

Command "${input}" doesn't exist.
Use "${prefix}help" to see available commands.
                                `.trim();
                                return api.sendMessage(errorMessage, event.threadID, event.messageID);
                        }
                }
        } catch (error) {
                console.log(error);
                const errorMessage = `
⚠ Error

An error occurred while processing your request.
Please try again later.
                `.trim();
                return api.sendMessage(errorMessage, event.threadID, event.messageID);
        }
};

module.exports.handleEvent = async function ({ api, event, prefix }) {
        const { threadID, messageID, body } = event;
        const message = `
◈ Bot Prefix

My current prefix is: "${prefix}"

◎ Use "${prefix}help" to see all available commands!
        `.trim();
        
        if (body?.toLowerCase().startsWith('prefix')) {
                api.sendMessage(message, threadID, messageID);
        }
};
